package org.edu_sharing.service.lti13.registration;

import com.google.gson.Gson;
import com.nimbusds.jose.jwk.AsymmetricJWK;
import com.nimbusds.jose.jwk.JWK;
import com.nimbusds.jose.jwk.JWKSet;
import org.alfresco.service.cmr.repository.NodeRef;
import org.apache.commons.codec.binary.Base64;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.entity.StringEntity;
import org.apache.log4j.Logger;
import org.edu_sharing.alfrescocontext.gate.AlfAppContextGate;
import org.edu_sharing.repository.client.rpc.ACL;
import org.edu_sharing.repository.client.tools.CCConstants;
import org.edu_sharing.repository.server.tools.ApplicationInfo;
import org.edu_sharing.repository.server.tools.ApplicationInfoList;
import org.edu_sharing.repository.server.tools.HttpQueryTool;
import org.edu_sharing.service.admin.AdminServiceFactory;
import org.edu_sharing.service.admin.SystemFolder;
import org.edu_sharing.service.authority.AuthorityServiceHelper;
import org.edu_sharing.service.lti13.RepoTools;
import org.edu_sharing.service.nodeservice.NodeServiceHelper;
import org.edu_sharing.service.permission.PermissionServiceFactory;
import org.json.simple.JSONArray;
import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;
import org.json.simple.parser.ParseException;

import java.net.URI;
import java.net.URL;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

public class RegistrationService {

    Logger logger = Logger.getLogger(RegistrationService.class);


    public DynamicRegistrationToken generate() throws Throwable{
        NodeRef systemObject = SystemFolder.getSystemObject(CCConstants.CCM_VALUE_IO_NAME_LTI_REGISTRATION_NODE_NAME);
        ACL acl = PermissionServiceFactory.getLocalService().getPermissions(systemObject.getId());
        if(acl.isInherited()) {
            PermissionServiceFactory.getLocalService().setPermissionInherit(systemObject.getId(), false);
        }
        DynamicRegistrationTokens systemObjectContent = SystemFolder.getSystemObjectContent(
                        CCConstants.CCM_VALUE_IO_NAME_LTI_REGISTRATION_NODE_NAME,
                DynamicRegistrationTokens.class);
        String token = UUID.randomUUID().toString();
        DynamicRegistrationToken dynamicRegistrationToken = new DynamicRegistrationToken();
        dynamicRegistrationToken.setUrl(ApplicationInfoList.getHomeRepository().getClientBaseUrl()+"/rest/lti/v13/registration/dynamic/"+token);
        dynamicRegistrationToken.setTsCreated(System.currentTimeMillis());
        dynamicRegistrationToken.setToken(token);
        systemObjectContent.getRegistrationLinks().add(dynamicRegistrationToken);
        write(systemObjectContent);
        return dynamicRegistrationToken;
    }

    public DynamicRegistrationTokens get(){
        return SystemFolder.getSystemObjectContent(
                CCConstants.CCM_VALUE_IO_NAME_LTI_REGISTRATION_NODE_NAME,
                DynamicRegistrationTokens.class);
    }

    public void write(DynamicRegistrationTokens toWrite) throws Throwable{
        String json = new Gson().toJson(toWrite);
        NodeServiceHelper.writeContentText(SystemFolder.getSystemObject( CCConstants.CCM_VALUE_IO_NAME_LTI_REGISTRATION_NODE_NAME),json);
    }

    public void remove(DynamicRegistrationToken token) throws Throwable{
        DynamicRegistrationTokens tokens = get();
        tokens.getRegistrationLinks().remove(token);
        write(tokens);
    }

    public void ltiDynamicRegistration(String openidConfiguration, String registrationToken, String eduSharingRegistrationToken) throws Throwable {
        //check repo lti kid is available
        ApplicationInfo homeApp = ApplicationInfoList.getHomeRepository();
        if(homeApp.getLtiKid() == null){
            String kid = UUID.randomUUID().toString();
            Map<String,String> newProps = new HashMap<>();
            newProps.put(ApplicationInfo.KEY_LTI_KID, kid);
            AdminServiceFactory.getInstance().updatePropertiesXML(homeApp.getAppFile(),newProps);
        }

        if(eduSharingRegistrationToken == null || eduSharingRegistrationToken.trim().equals("")){
            throw new Exception("no eduSharingRegistrationToken provided");
        }

        DynamicRegistrationToken dynamicRegistrationToken = new DynamicRegistrationToken();
        dynamicRegistrationToken.setToken(eduSharingRegistrationToken);

        if(!get().getRegistrationLinks().contains(dynamicRegistrationToken)){
            throw new Exception("eduSharing registration token provided is invalid");
        }

        DynamicRegistrationToken foundToken = get().getRegistrationLinks().stream()
                .filter(d -> d.equals(dynamicRegistrationToken))
                .findFirst().get();

        if((System.currentTimeMillis() - foundToken.getTsCreated()) > TimeUnit.DAYS.toMillis(1) ){
            remove(foundToken);
            throw new Exception("eduSharing registration token expired");
        }


        String platformConfiguration = new HttpQueryTool().query(openidConfiguration);
        JSONParser jsonParser = new JSONParser();
        JSONObject oidConfig = (JSONObject) jsonParser.parse(platformConfiguration);
        String issuer = (String) oidConfig.get("issuer");
        /**
         * @TODO it seems that moodle can not be validated like spec
         * validate https://www.imsglobal.org/spec/lti-dr/v1p0#issuer-and-openid-configuration-url-match
         *
         * 3.5.1 Issuer and OpenID Configuration URL Match
         */
        String keySetUrl = (String) oidConfig.get("jwks_uri");
        if(keySetUrl == null){
            throw new Exception("no jwks_uri provided");
        }
        String authorizationEndpoint = (String) oidConfig.get("authorization_endpoint");
        if(authorizationEndpoint == null){
            throw new Exception("no authorization_endpoint provided");
        }
        String registrationEndpoint = (String) oidConfig.get("registration_endpoint");
        if(registrationEndpoint == null){
            throw new Exception("no registration_endpoint provided");
        }

        String authTokenUrl = (String) oidConfig.get("token_endpoint");
        if(authTokenUrl == null){
            throw new Exception("no token_endpoint provided");
        }

        List<String> claimsSupported = (List<String>) oidConfig.get("claims_supported");

        JSONObject jsonResponse = new JSONObject();
        jsonResponse.put("application_type","web");
        JSONArray respTypes = new JSONArray();
        respTypes.add("id_token");
        jsonResponse.put("response_types", respTypes);
        jsonResponse.put("initiate_login_uri",homeApp.getClientBaseUrl()+"/rest/lti/v13/oidc/login_initiations");
        String redirectUrl = homeApp.getClientBaseUrl()+"/rest/lti/v13/lti13";
        JSONArray ja = new JSONArray();
        ja.add(redirectUrl);
        jsonResponse.put("redirect_uris",ja);
        jsonResponse.put("client_name",homeApp.getAppCaption());
        jsonResponse.put("jwks_uri",homeApp.getClientBaseUrl()+"/rest/lti/v13/jwks");
        String logo = homeApp.getClientBaseUrl()+"/assets/images/favicon.ico";
        jsonResponse.put("logo_uri",logo);
        jsonResponse.put("token_endpoint_auth_method", "private_key_jwt");
        JSONObject ltiDeepLink = new JSONObject();
        ltiDeepLink.put("type","LtiDeepLinkingRequest");
        ltiDeepLink.put("target_link_uri",redirectUrl);
        ltiDeepLink.put("label","add an edu-sharing content object");
        ltiDeepLink.put("label#de","Ein edu-sharing Inhalt hinzufuegen");
        JSONArray messages = new JSONArray();
        messages.add(ltiDeepLink);
        JSONObject toolConfig = new JSONObject();
        toolConfig.put("domain",homeApp.getDomain());
        toolConfig.put("messages",messages);
        toolConfig.put("claims", claimsSupported);
        jsonResponse.put("https://purl.imsglobal.org/spec/lti-tool-configuration",toolConfig);
        //jsonResponse.put("token_endpoint_auth_method","private_key_jwt");
        HttpPost post = new HttpPost();
        post.setEntity(new StringEntity(jsonResponse.toJSONString()));
        post.setURI(new URI(registrationEndpoint));
        post.setHeader("Content-Type","application/json");
        post.setHeader("Accept","application/json");

        if(registrationToken != null && !registrationToken.trim().equals("")){
            post.setHeader("Authorization","Bearer "+ registrationToken);
        }

        String result = new HttpQueryTool().query(null,null,post,false);

        JSONObject registrationResult;
        try {
            registrationResult = (JSONObject) jsonParser.parse(result);
        }catch(ParseException e){
            /**
             * filter non json i.i when moodle notices and warnings are enabled
             *
             * <b>Warning</b>:  Illegal string offset 'type' in <b>/var/www/html/moodle/mod/lti/classes/local/ltiopenid/registration_helper.php</b> on line <b>172</b><br />
             * <br />
             * <b>Warning</b>:  Illegal string offset 'type' in <b>/var/www/html/moodle/mod/lti/classes/local/ltiopenid/registration_helper.php</b> on line <b>172</b><br />
             * <br />
             * <b>Warning</b>:  Illegal string offset 'type' in <b>/var/www/html/moodle/mod/lti/classes/local/ltiopenid/registration_helper.php</b> on line <b>172</b><br />
             * <br />
             * <b>Warning</b>:  Illegal string offset 'type' in <b>/var/www/html/moodle/mod/lti/classes/local/ltiopenid/registration_helper.php</b> on line <b>172</b><br />
             * <br />
             * <b>Notice</b>:  Undefined property: stdClass::$id in <b>/var/www/html/moodle/mod/lti/openid-registration.php</b> on line <b>56</b><br />
             *
             */

            int start=result.indexOf('{');
            int end=result.lastIndexOf('}');
            String json=result.substring(start,end+1);
            registrationResult = (JSONObject) jsonParser.parse(json);
            logger.warn("registration result could only be parsed after html cleanup. maybe disable warnings and notices on platform side.");
        }
        String clientId = (String)registrationResult.get("client_id");
        /**
         * {"client_id":"IcOCHxHupFSZz2Z","response_types":["id_token"],"jwks_uri":"https:\/\/localhost.localdomain\/edu-sharing\/rest\/lti\/v13\/jwks",
         * "initiate_login_uri":"https:\/\/localhost.localdomain\/edu-sharing\/rest\/lti\/v13\/oidc\/login_initiations",
         * "grant_types":["client_credentials","implicit"],"redirect_uris":["https:\/\/localhost.localdomain\/edu-sharing\/rest\/lti\/v13\/lti13"],
         * "application_type":"web","token_endpoint_auth_method":"private_key_jwt","client_name":"local",
         * "logo_uri":"\/edu-sharing\/images\/logos\/edu_sharing_com_login.svg","scope":"",
         * "https:\/\/purl.imsglobal.org\/spec\/lti-tool-configuration":
         *  {"version":"1.3.0","deployment_id":"5","target_link_uri":"https:\/\/localhost.localdomain",
         * "domain":"localhost.localdomain","description":"","claims":["sub","iss"]}}
         */
        JSONObject ltiToolConfigInfo = (JSONObject)registrationResult.get("https://purl.imsglobal.org/spec/lti-tool-configuration");
        String deploymentId = (String)ltiToolConfigInfo.get("deployment_id");

        registerPlatform(issuer, clientId, deploymentId, authorizationEndpoint, keySetUrl,null,authTokenUrl);
        remove(foundToken);
    }

    public void registerPlatform(String platformId,
                                  String clientId, String deploymentId,
                                  String authenticationRequestUrl,
                                  String keysetUrl,
                                  String keyId,
                                  String authTokenUrl) throws Exception{
        HashMap<String,String> properties = new HashMap<>();
        properties.put(ApplicationInfo.KEY_APPID, new RepoTools().getAppId(platformId,clientId,deploymentId));
        properties.put(ApplicationInfo.KEY_TYPE, "lti");
        properties.put(ApplicationInfo.KEY_LTI_DEPLOYMENT_ID, deploymentId);
        properties.put(ApplicationInfo.KEY_LTI_ISS, platformId);
        properties.put(ApplicationInfo.KEY_LTI_CLIENT_ID, clientId);
        properties.put(ApplicationInfo.KEY_LTI_OIDC_ENDPOINT, authenticationRequestUrl);
        properties.put(ApplicationInfo.KEY_LTI_AUTH_TOKEN_ENDPOINT,authTokenUrl);
        properties.put(ApplicationInfo.KEY_LTI_KEYSET_URL,keysetUrl);

        JWKSet publicKeys = JWKSet.load(new URL(keysetUrl));
        if(publicKeys == null){
            throw new Exception("no public key found");
        }
        JWK jwk = (keyId == null) ? publicKeys.getKeys().get(0) :publicKeys.getKeyByKeyId(keyId);

        String pubKeyString = "-----BEGIN PUBLIC KEY-----\n"
                + new String(new Base64().encode(((AsymmetricJWK) jwk).toPublicKey().getEncoded())) + "-----END PUBLIC KEY-----";
        properties.put(ApplicationInfo.KEY_PUBLIC_KEY, pubKeyString);
        AdminServiceFactory.getInstance().addApplication(properties);
    }


}
