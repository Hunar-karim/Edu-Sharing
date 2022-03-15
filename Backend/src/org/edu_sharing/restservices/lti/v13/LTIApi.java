package org.edu_sharing.restservices.lti.v13;

import com.google.gson.Gson;
import com.nimbusds.jose.jwk.*;
import edu.uoc.elc.lti.tool.Tool;
import edu.uoc.elc.lti.tool.oidc.LoginRequest;
import edu.uoc.elc.spring.lti.security.openid.HttpSessionOIDCLaunchSession;
import edu.uoc.elc.spring.lti.security.openid.LoginRequestFactory;
import io.jsonwebtoken.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.alfresco.repo.security.authentication.AuthenticationComponent;
import org.alfresco.repo.security.authentication.AuthenticationUtil;
import org.apache.log4j.Logger;
import org.edu_sharing.alfrescocontext.gate.AlfAppContextGate;
import org.edu_sharing.repository.client.tools.CCConstants;
import org.edu_sharing.repository.client.tools.UrlTool;
import org.edu_sharing.repository.server.tools.ApplicationInfo;
import org.edu_sharing.repository.server.tools.ApplicationInfoList;
import org.edu_sharing.repository.server.tools.security.Signing;
import org.edu_sharing.restservices.NodeDao;
import org.edu_sharing.restservices.RepositoryDao;
import org.edu_sharing.restservices.RestConstants;
import org.edu_sharing.restservices.lti.v13.model.JWKResult;
import org.edu_sharing.restservices.lti.v13.model.JWKSResult;
import org.edu_sharing.restservices.lti.v13.model.RegistrationUrl;
import org.edu_sharing.restservices.shared.ErrorResponse;
import org.edu_sharing.restservices.shared.Node;
import org.edu_sharing.restservices.shared.NodeLTIDeepLink;
import org.edu_sharing.service.authority.AuthorityServiceFactory;
import org.edu_sharing.service.lti13.*;
import org.edu_sharing.service.lti13.model.LTISessionObject;
import org.edu_sharing.service.lti13.registration.DynamicRegistrationToken;
import org.edu_sharing.service.lti13.registration.DynamicRegistrationTokens;
import org.edu_sharing.service.lti13.registration.RegistrationService;
import org.edu_sharing.service.lti13.uoc.Config;
import org.edu_sharing.service.usage.Usage;
import org.edu_sharing.service.usage.Usage2Service;
import org.springframework.context.ApplicationContext;
import org.springframework.extensions.surf.util.URLEncoder;
import org.springframework.util.StringUtils;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpSession;
import javax.ws.rs.*;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.Response;
import java.net.URI;
import java.net.URISyntaxException;
import java.security.PublicKey;
import java.security.interfaces.RSAPublicKey;
import java.util.*;

@Path("/lti/v13")
@Consumes({ "text/html" })
@Produces({"text/html"})
@Tag(name="LTI v13")
public class LTIApi {

    Logger logger = Logger.getLogger(LTIApi.class);
    Usage2Service usageService = new Usage2Service();
    ApplicationContext applicationContext = AlfAppContextGate.getApplicationContext();
    AuthenticationComponent authenticationComponent = (AuthenticationComponent)applicationContext.getBean("authenticationComponent");

    @POST
    @Path("/oidc/login_initiations")
    @Operation(summary = "lti authentication process preparation.", description = "preflight phase. prepares lti authentication process. checks it issuer is valid")
    @Consumes({"application/x-www-form-urlencoded"})
    @ApiResponses(
            value = {
                    @ApiResponse(responseCode="200", description= RestConstants.HTTP_200, content = @Content(mediaType = "text/html", schema = @Schema(implementation = String.class))),
                    @ApiResponse(responseCode="400", description=RestConstants.HTTP_400, content = @Content(mediaType = "text/html", schema = @Schema(implementation = String.class))),
                    @ApiResponse(responseCode="401", description=RestConstants.HTTP_401, content = @Content(mediaType = "text/html", schema = @Schema(implementation = String.class))),
                    @ApiResponse(responseCode="403", description=RestConstants.HTTP_403, content = @Content(mediaType = "text/html", schema = @Schema(implementation = String.class))),
                    @ApiResponse(responseCode="404", description=RestConstants.HTTP_404, content = @Content(mediaType = "text/html", schema = @Schema(implementation = String.class))),
                    @ApiResponse(responseCode="500", description=RestConstants.HTTP_500, content = @Content(mediaType = "text/html", schema = @Schema(implementation = String.class)))
            })
    public Response loginInitiations(@Parameter(description = "Issuer of the request, will be validated",required=true) @FormParam(LTIConstants.LTI_PARAM_ISS) String iss,
                                 @Parameter(description = "target url of platform at the end of the flow",required=true) @FormParam(LTIConstants.LTI_PARAM_TARGET_LINK_URI) String targetLinkUrl,
                                 @Parameter(description = "Id of the issuer",required=false) @FormParam(LTIConstants.LTI_PARAM_CLIENT_ID) String clientId,
                                 @Parameter(description = "context information of the platform",required=false) @FormParam(LTIConstants.LTI_PARAM_LOGIN_HINT) String loginHint,
                                 @Parameter(description = "additional context information of the platform",required=false) @FormParam(LTIConstants.LTI_PARAM_MESSAGE_HINT) String ltiMessageHint,
                                 @Parameter(description = "A can have multiple deployments in a platform",required=false) @FormParam(LTIConstants.LTI_PARAM_DEPLOYMENT_ID) String ltiDeploymentId,
                                 @Context HttpServletRequest req
                                 ){
        /**
         * @TODO check if multiple deployments got an own key pair
         */

        RepoTools repoTools = new RepoTools();
        try {

            ApplicationInfo platform = repoTools.getApplicationInfo(iss, clientId, ltiDeploymentId);
            Tool tool = Config.getTool(platform,req,true);
            // get data from request
            final LoginRequest loginRequest = LoginRequestFactory.from(req);
            if (this.logger.isInfoEnabled()) {
                this.logger.info("OIDC launch received with " + loginRequest.toString());
            }
            final URI uri = new URI(loginRequest.getTarget_link_uri());
			/* commented in local because localhost resolves to 0:0:0:0
			if (!uri.getHost().equals(request.getRemoteHost())) {
				throw new ServletException("Bad request");
			}
			*/

            // do the redirection
            String authRequest = tool.getOidcAuthUrl(loginRequest);

            /**
             * fix: when it's an LtiResourceLinkRequest moodle sends rendering url (/edu-sharing/components/render)
             * as targetUrl. edu.uoc.elc.lti.tool.Tool take this url for redirect_url which is wrong
             */
            authRequest = UrlTool.removeParam(authRequest,"redirect_uri");
            authRequest = UrlTool.setParam(authRequest,"redirect_uri",ApplicationInfoList.getHomeRepository().getClientBaseUrl()+"/rest/lti/v13/" + LTIConstants.LTI_TOOL_REDIRECTURL_PATH);


            //response.sendRedirect(authRequest);
            return Response.status(302).location(new URI(authRequest)).build();

        } catch (Throwable e) {
            logger.error(e.getMessage(),e);
            return processError(req,e,"LTI_ERROR");
        }
    }

    /**
     * store multiple for allowing multiple deployments of edu-sharing(ltitool) in lms(lti platform)
     * @param session
     * @param params
     */
    private void storeInSession(HttpSession session, Map<String,String> params){
        for(Map.Entry<String,String> entry : params.entrySet()){
            List<String> list = (List<String>)session.getAttribute(entry.getKey());
            if(list == null){
               list = new ArrayList<>();
            }
            list.add(entry.getValue());
            session.setAttribute(entry.getKey(), list);
        }
    }

    private String getHTML(String formTargetUrl, Map<String,String> params, String errorMessage){
        return this.getHTML(formTargetUrl,params,errorMessage,null);
    }
    /**
     * @TODO use template engine?
     * @param formTargetUrl
     * @param params
     * @return
     */
    private String getHTML(String formTargetUrl, Map<String,String> params, String message, String javascript){
        StringBuilder sb = new StringBuilder();
        sb.append("<html><body>");
        if(javascript != null){
            sb.append("<script type=\"text/javascript\">"+javascript+"</script>");
        }
        if(message == null) {
            String FORMNAME = "ltiform";
            sb.append("<script type=\"text/javascript\">window.onload=function(){document.forms[\""+FORMNAME+"\"].submit();}</script>");
            sb.append("<form action=\"" + formTargetUrl + "\" method=\"post\" name=\"" + FORMNAME + "\"");
            for (Map.Entry<String, String> entry : params.entrySet()) {
                sb.append("<input type=\"hidden\" id=\"" + entry.getKey() + "\" name=\"" + entry.getKey() + "\" value=\"" + entry.getValue() + "\" class=\"form-control\"/>");
            }
            sb.append("<input type=\"submit\" value=\"Submit POST\" class=\"btn btn-primary\">")
                    .append("</form>");
        }else {
            sb.append(message);
        }
        sb.append("</body></html>");
        return sb.toString();
    }


    @POST
    @Path("/" + LTIConstants.LTI_TOOL_REDIRECTURL_PATH)
    @Operation(summary = "lti tool redirect.", description = "lti tool redirect")

    @Consumes({ "application/x-www-form-urlencoded" })
    @ApiResponses(
            value = {
                    @ApiResponse(responseCode="200", description=RestConstants.HTTP_200, content = @Content(mediaType = "text/html", schema = @Schema(implementation = String.class))),
                    @ApiResponse(responseCode="400", description=RestConstants.HTTP_400, content = @Content(mediaType = "text/html", schema = @Schema(implementation = String.class))),
                    @ApiResponse(responseCode="401", description=RestConstants.HTTP_401, content = @Content(mediaType = "text/html", schema = @Schema(implementation = String.class))),
                    @ApiResponse(responseCode="403", description=RestConstants.HTTP_403, content = @Content(mediaType = "text/html", schema = @Schema(implementation = String.class))),
                    @ApiResponse(responseCode="404", description=RestConstants.HTTP_404, content = @Content(mediaType = "text/html", schema = @Schema(implementation = String.class))),
                    @ApiResponse(responseCode="500", description=RestConstants.HTTP_500, content = @Content(mediaType = "text/html", schema = @Schema(implementation = String.class)))
            })
    public Response lti(@Parameter(description = "Issuer of the request, will be validated",required=true) @FormParam("id_token") String idToken,
                        @Parameter(description = "Issuer of the request, will be validated",required=true) @FormParam("state") String state,
                        @Context HttpServletRequest req){
        logger.info("id_token:"+idToken +" state:"+state);


        try{
            if(state == null) {
                throw new IllegalStateException("no state param provided");
            }

            if (idToken == null) {
                String message = "The request is not a LTI request, so no credentials at all. Returning current credentials";
                this.logger.error(message);
                throw new IllegalStateException(message);
            }

            /**
             * get claims cause we need clientId,deploymentId,iss for applicationinfo of plattform to instance tool
             * token will be validated with public key of the platform app
             * @TODO use keyset url
             */
            LTIJWTUtil ltijwtUtil = new LTIJWTUtil();
            Jws<Claims> jws = ltijwtUtil.validateJWT(idToken);

            /**
             * validate nonce
             */
            String nonce = jws.getBody().get("nonce", String.class);
            String sessionNonce = new HttpSessionOIDCLaunchSession(req).getNonce();
            if(!nonce.equals(sessionNonce)){
                throw new IllegalStateException("nonce is invalid");
            }

            Tool tool = Config.getTool(ltijwtUtil.getPlatform(),req,false);

            /**
             * Launch validation: validates authentication response, and specific message(deeplink,....) validation
             * https://www.imsglobal.org/spec/security/v1p0/#authentication-response-validation
             */
            tool.validate(idToken, state);
            if (!tool.isValid()) {
                logger.error(tool.getReason());
                throw new IllegalStateException(tool.getReason());
            }

            //check version
            String ltiVersion = jws.getBody().get(LTIConstants.LTI_VERSION, String.class);
            if(!LTIConstants.LTI_VERSION_3.equals(ltiVersion)){
                throw new Exception("lti version:" +ltiVersion +" not allowed");
            }


            /*List<String> sessionStates = (List<String>)req.getSession().getAttribute(LTIConstants.LTI_TOOL_SESS_ATT_STATE);
            if(sessionStates == null){
                throw new IllegalStateException("no states initiated for this session");
            }

            if(!sessionStates.contains(state)){
                throw new IllegalStateException("LTI request doesn't contains the expected state");
            }*/




            if(StringUtils.hasText(idToken)){
                //Now we validate the JWT token
                if (jws != null) {



                    /**
                     * safe to session for later usage
                     */
                    String ltiMessageType = jws.getBody().get(LTIConstants.LTI_MESSAGE_TYPE,String.class);
                    LTISessionObject ltiSessionObject = new LTISessionObject();
                    ltiSessionObject.setDeploymentId(jws.getBody().get(LTIConstants.LTI_DEPLOYMENT_ID,String.class));
                    ltiSessionObject.setIss(jws.getBody().get(LTIConstants.LTI_PARAM_ISS,String.class));
                    ltiSessionObject.setNonce(jws.getBody().get(LTIConstants.LTI_NONCE,String.class));
                    ltiSessionObject.setMessageType(ltiMessageType);
                    ltiSessionObject.setEduSharingAppId(new RepoTools().getAppId(ltiSessionObject.getIss(),
                            jws.getBody().getAudience(),
                            ltiSessionObject.getDeploymentId()));

                    Map<String,Object> context = jws.getBody().get(LTIConstants.DEEP_LINK_CONTEXT, Map.class);
                    if(context != null){
                        String courseId = (String)context.get("id");
                        if (courseId != null) {
                            ltiSessionObject.setContextId(courseId);
                        }
                    }


                    /**
                     * edu-sharing authentication
                     */
                    if(!ltiMessageType.equals(LTIConstants.LTI_MESSAGE_TYPE_DEEP_LINKING) &&
                            !ApplicationInfoList.getRepositoryInfoById(ltiSessionObject.getEduSharingAppId()).isLtiSyncReaders()){
                        //authenticationComponent.setCurrentUser(AuthorityServiceImpl.PROXY_USER);
                        RepoTools.authenticate(req,
                                RepoTools.mapToSSOMap(CCConstants.PROXY_USER, null, null, null));
                    }else{
                        String user = jws.getBody().getSubject();
                        Map<String,String> ext = ( Map<String,String>)jws.getBody().get("https://purl.imsglobal.org/spec/lti/claim/ext",Map.class);
                        if(ext != null){
                            if(ext.containsKey("user_username")){
                                String tmpUser = ext.get("user_username");
                                if(tmpUser != null && !tmpUser.trim().isEmpty()){
                                    user = tmpUser;
                                }
                            }
                        }
                        user = user+"@"+jws.getBody().getIssuer();

                        String name = jws.getBody().get(LTIConstants.LTI_NAME, String.class);
                        String familyName = jws.getBody().get(LTIConstants.LTI_FAMILY_NAME, String.class);
                        String givenName = jws.getBody().get(LTIConstants.LTI_GIVEN_NAME, String.class);
                        String email = jws.getBody().get(LTIConstants.LTI_EMAIL, String.class);

                        String authenticatedUsername = RepoTools.authenticate(req,
                                RepoTools.mapToSSOMap(user, givenName, familyName, email));
                    }

                    /**
                     * @TODO: what happens when user is using the sames session within two browser windows
                     * maybe use list of LTISessionObject's
                     */
                    req.getSession().setAttribute(LTISessionObject.class.getName(),ltiSessionObject);

                    if(ltiMessageType.equals(LTIConstants.LTI_MESSAGE_TYPE_DEEP_LINKING)){
                        if(jws.getBody().containsKey(LTIConstants.DEEP_LINKING_SETTINGS)){
                            Map deepLinkingSettings = jws.getBody().get(LTIConstants.DEEP_LINKING_SETTINGS, Map.class);
                            ltiSessionObject.setDeepLinkingSettings(deepLinkingSettings);
                        }
                        /**
                         * @TODO check if this kind of redirect works
                         */

                        //return Response.status(302).location(new URI(ApplicationInfoList.getHomeRepository().getClientBaseUrl()+"/edu-sharing/components/search")).build();
                        return Response.seeOther(new URI(ApplicationInfoList.getHomeRepository().getClientBaseUrl()+"/components/search")).build();
                        //return Response.temporaryRedirect(new URI("/edu-sharing/components/search")).build();
                    }else if(ltiMessageType.equals(LTIConstants.LTI_MESSAGE_TYPE_RESOURCE_LINK)){
                        //rendering stuff
                        /**
                         * @TODO check for launch_presentation
                         * "https://purl.imsglobal.org/spec/lti/claim/launch_presentation": {
                         *     "locale": "en",
                         *     "document_target": "iframe",
                         *     "return_url": "http://localhost/moodle/mod/lti/return.php?course=2&launch_container=3&instanceid=1&sesskey=q6noraEPlA"
                         *   }
                         */
                        String targetLink = jws.getBody().get(LTIConstants.LTI_TARGET_LINK_URI, String.class);
                        String[] splitted = targetLink.split("/");
                        String nodeId = splitted[splitted.length -1].split("\\?")[0];
                        if(ApplicationInfoList.getRepositoryInfoById(ltiSessionObject.getEduSharingAppId()).isLtiUsagesEnabled()){
                            Usage usage = usageService.getUsage(ltiSessionObject.getEduSharingAppId(), ltiSessionObject.getContextId(), nodeId, null);
                            if(usage != null){
                                req.getSession().setAttribute(CCConstants.AUTH_SINGLE_USE_NODEID, nodeId);
                            }
                        }
                        return Response.seeOther(new URI(targetLink)).build();
                        //return Response.temporaryRedirect(new URI(targetLink)).build();
                    }else{
                        String message = "can not handle message type:" + ltiMessageType;
                        logger.error(message);
                        throw new Exception(message);
                    }
                }
            }
        }catch(Exception e){
            logger.error(e.getMessage(),e);
            return processError(req,e,"LTI_ERROR");
        }


        return Response.status(Response.Status.OK).build();
    }

    private Response processError(HttpServletRequest req, Throwable e, String errorType){
        try {
            return Response.seeOther(new URI(req.getScheme() +"://"
                            + req.getServerName()
                            + "/edu-sharing/components/messages/"+errorType+"/"+ URLEncoder.encode(e.getMessage())))
                    .build();
        } catch (URISyntaxException ex) {
            return Response.status(Response.Status.OK).entity(getHTML(null,null,"error:" + ex.getMessage())).build();
        }
    }

    @GET
    @Path("/generateDeepLinkingResponse")
    @Operation(summary = "generate DeepLinkingResponse")
    @Consumes({ "application/json" })
    @Produces({ "application/json"})
    @ApiResponses(value = {
            @ApiResponse(responseCode="200", description=RestConstants.HTTP_200, content = @Content(schema = @Schema(implementation = NodeLTIDeepLink.class))),
            @ApiResponse(responseCode="400", description=RestConstants.HTTP_400, content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode="401", description=RestConstants.HTTP_401, content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode="403", description=RestConstants.HTTP_403, content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode="404", description=RestConstants.HTTP_404, content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode="500", description=RestConstants.HTTP_500, content = @Content(schema = @Schema(implementation = ErrorResponse.class))) })
    public Response generateDeepLinkingResponse(@Parameter(description = "selected node id's",required=true)  @QueryParam("nodeIds")  List<String> nodeIds,
                                                @Context HttpServletRequest req){
        LTISessionObject ltiSessionObject = (LTISessionObject)req
                .getSession()
                .getAttribute(LTISessionObject.class.getName());
        try {
            if (ltiSessionObject != null) {
                RepositoryDao repoDao = RepositoryDao.getHomeRepository();
                List<Node> nodes = new ArrayList<>();
                for(String nodeId : nodeIds){
                    Node n = NodeDao.getNode(repoDao, nodeId).asNode();
                    nodes.add(n);
                }

                NodeLTIDeepLink dl = new NodeLTIDeepLink((String)ltiSessionObject.getDeepLinkingSettings().get(LTIConstants.DEEP_LINK_RETURN_URL),
                        new LTIJWTUtil().getDeepLinkingResponseJwt(ltiSessionObject, nodes.toArray(new Node[]{})));

                if(ApplicationInfoList.getRepositoryInfoById(ltiSessionObject.getEduSharingAppId()).isLtiUsagesEnabled()){
                    String user = AuthenticationUtil.getFullyAuthenticatedUser();
                    for(String nodeId : nodeIds) {
                        usageService.setUsage(ApplicationInfoList.getHomeRepository().getAppId(),
                                user,
                                ltiSessionObject.getEduSharingAppId(),
                                ltiSessionObject.getContextId(),
                                nodeId,
                                (String) AuthorityServiceFactory.getLocalService().getUserInfo(user).get(CCConstants.PROP_USER_EMAIL),
                                null,null,-1,null,
                                null, //TODO moodle does not deliver such information
                                null);
                    }
                }

                return Response.ok(dl).build();
            }else{
                throw new Exception("no active lti session");
            }
        }catch (Throwable t){
            return ErrorResponse.createResponse(t);
        }
    }

    /**
     * jsonResponse.put("jwks_uri",homeApp.getClientBaseUrl()+"/rest/lti/v13/jwks");
     *
     */
    @GET
    @Path("/jwks")
    @Operation(summary = "LTI - returns repository JSON Web Key Sets")
    @Consumes({ "application/json" })
    @Produces({"application/json"})
    @ApiResponses(
            value = {
                    @ApiResponse(responseCode="200", description= RestConstants.HTTP_200, content = @Content(schema = @Schema(implementation = RegistrationUrl.class))),
                    @ApiResponse(responseCode="400", description=RestConstants.HTTP_400, content = @Content(schema = @Schema(implementation = String.class))),
                    @ApiResponse(responseCode="401", description=RestConstants.HTTP_401, content = @Content(schema = @Schema(implementation = String.class))),
                    @ApiResponse(responseCode="403", description=RestConstants.HTTP_403, content = @Content(schema = @Schema(implementation = String.class))),
                    @ApiResponse(responseCode="404", description=RestConstants.HTTP_404, content = @Content(schema = @Schema(implementation = String.class))),
                    @ApiResponse(responseCode="500", description=RestConstants.HTTP_500, content = @Content(schema = @Schema(implementation = String.class)))
            })
    public Response jwksUri(){
        try {

            ApplicationInfo homeApp = ApplicationInfoList.getHomeRepository();
            Signing signing = new Signing();
            PublicKey pemPublicKey = signing.getPemPublicKey(homeApp.getPublicKey(), CCConstants.SECURITY_KEY_ALGORITHM);
            RSAPublicKey pub = (RSAPublicKey)pemPublicKey;
            JWKSResult rs = new JWKSResult();

            String kid = homeApp.getLtiKid();

            JWKResult JWKResult = new Gson().fromJson(new RSAKey.Builder(pub)
                    .keyUse(KeyUse.SIGNATURE)
                    //.privateKey((RSAPrivateKey)privKey)
                    .keyID(kid)
                    .build().toPublicJWK().toJSONString(), JWKResult.class);
            JWKResult.setAlg(SignatureAlgorithm.RS256.getValue());

            rs.setKeys(Arrays.asList(new JWKResult[]{JWKResult}));
            return Response.status(Response.Status.OK).entity(rs).build();
        }catch(Throwable e){
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).entity(new ErrorResponse(e)).build();
        }
    }

    @GET
    @Path("/registration/dynamic/{token}")
    @Operation(summary = "LTI Dynamic Registration - Initiate registration")
    @Consumes({ "text/html" })
    @Produces({"text/html"})
    @ApiResponses(
            value = {
                    @ApiResponse(responseCode="200", description= RestConstants.HTTP_200, content = @Content(mediaType = "text/html", schema = @Schema(implementation = String.class))),
                    @ApiResponse(responseCode="400", description=RestConstants.HTTP_400, content = @Content(mediaType = "text/html", schema = @Schema(implementation = String.class))),
                    @ApiResponse(responseCode="401", description=RestConstants.HTTP_401, content = @Content(mediaType = "text/html", schema = @Schema(implementation = String.class))),
                    @ApiResponse(responseCode="403", description=RestConstants.HTTP_403, content = @Content(mediaType = "text/html", schema = @Schema(implementation = String.class))),
                    @ApiResponse(responseCode="404", description=RestConstants.HTTP_404, content = @Content(mediaType = "text/html", schema = @Schema(implementation = String.class))),
                    @ApiResponse(responseCode="500", description=RestConstants.HTTP_500, content = @Content(mediaType = "text/html", schema = @Schema(implementation = String.class)))
            })
    public Response ltiRegistrationDynamic(@Parameter(description = "the endpoint to the open id configuration to be used for this registration",required=true) @QueryParam("openid_configuration") String openidConfiguration,
                                           @Parameter(description = "the registration access token. If present, it must be used as the access token by the tool when making the registration request to the registration endpoint exposed in the openid configuration.",required=false) @QueryParam("registration_token") String registrationToken,
                                           @Parameter(description = "one time usage token which is autogenerated with the url in edu-sharing admin gui.", required = true) @PathParam("token") String eduSharingRegistrationToken,
                                           @Context HttpServletRequest req){

       try{
            RegistrationService registrationService = new RegistrationService();
            Throwable throwable = AuthenticationUtil.runAsSystem(() -> {
                try {
                    registrationService.ltiDynamicRegistration(openidConfiguration, registrationToken, eduSharingRegistrationToken);
                } catch (Throwable ex) {
                    return ex;
                }
                return null;
            });
            if(throwable != null) throw throwable;

           return Response.seeOther(new URI(req.getScheme() +"://"
                           + req.getServerName()
                           + "/edu-sharing/components/lti"))
                   .build();
        }catch(Throwable e){
           logger.error(e.getMessage(),e);
           return processError(req,e,"LTI_REG_ERROR");
       }

    }


    @GET
    @Path("/registration/url")
    @Operation(summary = "LTI Dynamic Registration - generates url for platform")
    @Consumes({ "application/json" })
    @Produces({"application/json"})
    @ApiResponses(
            value = {
                    @ApiResponse(responseCode="200", description= RestConstants.HTTP_200, content = @Content(schema = @Schema(implementation = DynamicRegistrationTokens.class))),
                    @ApiResponse(responseCode="400", description=RestConstants.HTTP_400, content = @Content(schema = @Schema(implementation = String.class))),
                    @ApiResponse(responseCode="401", description=RestConstants.HTTP_401, content = @Content(schema = @Schema(implementation = String.class))),
                    @ApiResponse(responseCode="403", description=RestConstants.HTTP_403, content = @Content(schema = @Schema(implementation = String.class))),
                    @ApiResponse(responseCode="404", description=RestConstants.HTTP_404, content = @Content(schema = @Schema(implementation = String.class))),
                    @ApiResponse(responseCode="500", description=RestConstants.HTTP_500, content = @Content(schema = @Schema(implementation = String.class)))
            })
    public Response ltiRegistrationUrl(@Parameter(description = "if to add a ne url to the list",required=true, schema = @Schema(defaultValue="false" ) ) @QueryParam("generate") boolean generate,
                                       @Context HttpServletRequest req){

        try {
            RegistrationService registrationService = new RegistrationService();
            if(generate){
                registrationService.generate();
            }
            return Response.status(Response.Status.OK).entity(registrationService.get()).build();
        }catch(Throwable e){
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).entity(new ErrorResponse(e)).build();
        }
    }

    @DELETE
    @Path("/registration/url/{token}")
    @Operation(summary = "LTI Dynamic Regitration - delete url")
    @Consumes({ "application/json" })
    @Produces({"application/json"})
    @ApiResponses(
            value = {
                    @ApiResponse(responseCode="200", description= RestConstants.HTTP_200, content = @Content(schema = @Schema(implementation = DynamicRegistrationTokens.class))),
                    @ApiResponse(responseCode="400", description=RestConstants.HTTP_400, content = @Content(schema = @Schema(implementation = String.class))),
                    @ApiResponse(responseCode="401", description=RestConstants.HTTP_401, content = @Content(schema = @Schema(implementation = String.class))),
                    @ApiResponse(responseCode="403", description=RestConstants.HTTP_403, content = @Content(schema = @Schema(implementation = String.class))),
                    @ApiResponse(responseCode="404", description=RestConstants.HTTP_404, content = @Content(schema = @Schema(implementation = String.class))),
                    @ApiResponse(responseCode="500", description=RestConstants.HTTP_500, content = @Content(schema = @Schema(implementation = String.class)))
            })
    public Response removeLtiRegistrationUrl(@Parameter(description = "the token of the link you have to remove", required = true) @PathParam("token") String token,
                                                 @Context HttpServletRequest req){

        try {
            DynamicRegistrationToken dynamicRegistrationToken = new DynamicRegistrationToken();
            dynamicRegistrationToken.setToken(token);
            RegistrationService registrationService = new RegistrationService();
            registrationService.remove(dynamicRegistrationToken);
            return Response.status(Response.Status.OK).entity(registrationService.get()).build();
        }catch(Throwable e){
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).entity(new ErrorResponse(e)).build();
        }
    }



    @POST
    @Path("/registration/static")
    @Operation(summary = "register LTI platform")
    @Consumes({ "application/json" })
    @Produces({ "application/json"})
    @ApiResponses(value = {
            @ApiResponse(responseCode="200", description=RestConstants.HTTP_200, content = @Content(schema = @Schema(implementation = Void.class))),
            @ApiResponse(responseCode="400", description=RestConstants.HTTP_400, content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode="401", description=RestConstants.HTTP_401, content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode="403", description=RestConstants.HTTP_403, content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode="404", description=RestConstants.HTTP_404, content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode="500", description=RestConstants.HTTP_500, content = @Content(schema = @Schema(implementation = ErrorResponse.class))) })
    public Response registerTest(@Parameter(description = "the issuer",required=true) @QueryParam("platformId") String platformId,
                                 @Parameter(description = "client id",required=true) @QueryParam("client_id") String clientId,
                                 @Parameter(description = "deployment id",required=true)  @QueryParam("deployment_id") String deploymentId,
                                 @Parameter(description = "oidc endpoint, authentication request url",required=true) @QueryParam("authentication_request_url") String authenticationRequestUrl,
                                 @Parameter(description = "jwks endpoint, keyset url",required=true) @QueryParam("keyset_url") String keysetUrl,
                                 @Parameter(description = "jwks key id",required=false) @QueryParam("key_id") String keyId,
                                 @Parameter(description = "auth token url",required=true) @QueryParam("auth_token_url") String authTokenUrl,
                                 @Context HttpServletRequest req
    ){
        try {
            new RegistrationService().registerPlatform(platformId,clientId,deploymentId,authenticationRequestUrl,keysetUrl,keyId,authTokenUrl);
            return Response.ok().build();
        } catch (Throwable t) {
            return ErrorResponse.createResponse(t);
        }
    }

    public static enum LTI_Plattforms {moodle};

    @POST
    @Path("/registration/{type}")
    @Operation(summary = "register LTI platform")
    @Consumes({ "application/json" })
    @Produces({ "application/json"})
    @ApiResponses(value = {
            @ApiResponse(responseCode="200", description=RestConstants.HTTP_200, content = @Content(schema = @Schema(implementation = Void.class))),
            @ApiResponse(responseCode="400", description=RestConstants.HTTP_400, content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode="401", description=RestConstants.HTTP_401, content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode="403", description=RestConstants.HTTP_403, content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode="404", description=RestConstants.HTTP_404, content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode="500", description=RestConstants.HTTP_500, content = @Content(schema = @Schema(implementation = ErrorResponse.class))) })
    public Response registerByType(@Parameter(description = "lti platform typ i.e. moodle", required=true) @PathParam("type") LTI_Plattforms type,
                                   @Parameter(description = "base url i.e. http://localhost/moodle used as platformId",required=true) @QueryParam("baseUrl") String baseUrl,
                                   @Parameter(description = "client id",required=false) @QueryParam("client_id") String clientId,
                                   @Parameter(description = "deployment id",required=false) @QueryParam("deployment_id") String deploymentId,
                                   @Context HttpServletRequest req
    ){
        try {

            new RegistrationService().registerPlatform(baseUrl,clientId,deploymentId,
                    baseUrl + LTIConstants.MOODLE_AUTHENTICATION_REQUEST_URL_PATH,
                    baseUrl + LTIConstants.MOODLE_KEYSET_URL_PATH,
                    null,
                    baseUrl+LTIConstants.MOODLE_AUTH_TOKEN_URL_PATH);
            return Response.ok().build();
        } catch (Throwable t) {
            return ErrorResponse.createResponse(t);
        }
    }


}
