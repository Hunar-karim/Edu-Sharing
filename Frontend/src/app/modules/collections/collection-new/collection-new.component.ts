import {
    Component,
    OnInit,
    NgZone,
    HostListener,
    ViewChild,
    Sanitizer,
    ElementRef,
    EventEmitter
} from '@angular/core';


import {Router, Params, ActivatedRoute} from "@angular/router";

import {Translation} from '../../../core-ui-module/translation';

import * as EduData from "../../../core-module/core.module";

import {RestCollectionService, ListItem, DialogButton, RestMediacenterService, RestMdsService, UIService} from "../../../core-module/core.module";
import {RestNodeService} from "../../../core-module/core.module";
import {RestConstants} from "../../../core-module/core.module";
import {RestHelper} from "../../../core-module/core.module";
import {Toast} from "../../../core-ui-module/toast";
import {RestIamService} from "../../../core-module/core.module";
import {Group, IamGroups, IamUser, LoginResult, NodeRef, Permission} from '../../../core-module/core.module';
import {User} from "../../../core-module/core.module";
import {LocalPermissions} from "../../../core-module/core.module";
import {Collection} from "../../../core-module/core.module";
import {RestConnectorService} from "../../../core-module/core.module";
import {ConfigurationService} from "../../../core-module/core.module";
import {SessionStorageService} from "../../../core-module/core.module";
import {UIConstants} from "../../../core-module/ui/ui-constants";
import {MdsComponent} from "../../../common/ui/mds/mds.component";
import {TranslateService} from "@ngx-translate/core";
import {ColorHelper, PreferredColor} from '../../../core-module/ui/color-helper';
import {DomSanitizer} from "@angular/platform-browser";
import {TemporaryStorageService} from "../../../core-module/core.module";
import {RegisterResetPasswordComponent} from "../../register/register-reset-password/register-reset-password.component";
import {MainNavComponent} from '../../../common/ui/main-nav/main-nav.component';
import {UIHelper} from "../../../core-ui-module/ui-helper";
import {GlobalContainerComponent} from "../../../common/ui/global-container/global-container.component";
import {AuthorityNamePipe} from "../../../core-ui-module/pipes/authority-name.pipe";
import {BridgeService} from '../../../core-bridge-module/bridge.service';
import {WorkspaceShareComponent} from "../../workspace/share/share.component";
import {MdsMetadatasets} from '../../../core-module/core.module';
import {ConfigurationHelper} from '../../../core-module/core.module';
import {NodeHelperService} from '../../../core-ui-module/node-helper.service';
import { SkipTarget } from '../../../common/ui/skip-nav/skip-nav.service';

type Step = 'NEW' | 'GENERAL' | 'METADATA' | 'PERMISSIONS' | 'SETTINGS' | 'EDITORIAL_GROUPS';

// component class
@Component({
  selector: 'app-collection-new',
  templateUrl: 'collection-new.component.html',
  styleUrls: ['collection-new.component.scss']
})
export class CollectionNewComponent {
  readonly SkipTarget = SkipTarget;
  @ViewChild('mainNav') mainNavRef: MainNavComponent;
  @ViewChild('mds') mds : MdsComponent;
  @ViewChild('share') shareRef : WorkspaceShareComponent;
  public hasCustomScope: boolean;
  public COLORS:string[];
  public DEFAULT_COLORS:string[]=['#975B5D','#692426','#E6B247','#A89B39','#699761','#32662A','#60998F','#29685C','#759CB7','#537997','#976097','#692869'];
  public isLoading = true;
  public showPermissions = false;
  currentCollection: EduData.Node;
  public newCollectionType:string;
  public properties:any;
  public reloadMds:Boolean;
  private hasUserAnyOrgasYet = false;
  user : User;
  public mainnav = true;
  public editPermissionsId: string;
  permissions: LocalPermissions = null;
  public canInvite: boolean;
  public shareToAll: boolean;
  public createEditorial = false;
  public createCurriculum = false;
  public createMediacenter = false;
  public mediacenter:any;
  public parentId: any;
  public editId: any;
  public editorialGroups:Group[]=[];
  public editorialGroupsSelected:Group[]=[];
  public editorialPublic = true;
  public editorialColumns:ListItem[]=[new ListItem("GROUP",RestConstants.AUTHORITY_DISPLAYNAME)];
  imageData:any = null;
  private imageFile:File = null;
  readonly STEP_NEW = 'NEW';
  readonly STEP_GENERAL = 'GENERAL';
  readonly STEP_METADATA = 'METADATA';
  readonly STEP_PERMISSIONS = 'PERMISSIONS';
  private STEP_SETTINGS = 'SETTINGS';
  readonly STEP_EDITORIAL_GROUPS = 'EDITORIAL_GROUPS';
  STEP_ICONS: { [step in Step]?: string }={
    GENERAL:'edit',
    METADATA:'info_outline',
    PERMISSIONS:'group_add',
    SETTINGS:'settings',
    EDITORIAL_GROUPS:'star'
  };
  public newCollectionStep: Step = this.STEP_NEW;
  public editPermissionsDummy: EduData.Node;
  availableSteps: Step[];
  private parentCollection: EduData.Node;
  private originalPermissions: LocalPermissions;
  private permissionsInfo: any;

  @ViewChild('file') imageFileRef : ElementRef;
  @ViewChild('authorFreetextInput') authorFreetextInput : ElementRef<HTMLInputElement>;
  buttons: DialogButton[];
  authorFreetext=false;
  authorFreetextAllowed=false;
  mdsSet: string;

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if(event.code=="Escape"){
      event.preventDefault();
      event.stopPropagation();
      this.goBack();
      return;
    }
  }

  constructor(
      private collectionService : RestCollectionService,
      private nodeService : RestNodeService,
      private connector : RestConnectorService,
      private nodeHelper: NodeHelperService,
      private uiService : UIService,
      private iamService : RestIamService,
      private mediacenterService : RestMediacenterService,
      private route:ActivatedRoute,
      private mdsService:RestMdsService,
      private router: Router,
      private toast : Toast,
      private bridge : BridgeService,
      private temporaryStorage : TemporaryStorageService,
      private storage : SessionStorageService,
      private zone: NgZone,
      private sanitizer: DomSanitizer,
      private config : ConfigurationService,
      private translationService:TranslateService) {
    Translation.initialize(this.translationService,this.config,this.storage,this.route).subscribe(()=>{
      this.connector.isLoggedIn().subscribe((data) => {
        this.mdsService.getSets().subscribe((mdsSets) => {
          const sets = ConfigurationHelper.filterValidMds(RestConstants.HOME_REPOSITORY, mdsSets.metadatasets, this.config);
          this.mdsSet = sets[0]?.id;

          this.COLORS=this.config.instant('collections.colors',this.DEFAULT_COLORS);
          if(data.statusCode!=RestConstants.STATUS_CODE_OK){
            UIHelper.getCommonParameters(this.route).subscribe((params)=> {
              this.router.navigate([UIConstants.ROUTER_PREFIX + "collections",{queryParams:params}]);
            });
            return;
          }
          this.canInvite=this.connector.hasToolPermissionInstant(RestConstants.TOOLPERMISSION_INVITE);
          this.shareToAll=this.connector.hasToolPermissionInstant(RestConstants.TOOLPERMISSION_INVITE_ALLAUTHORITIES);
          this.createEditorial=this.connector.hasToolPermissionInstant(RestConstants.TOOLPERMISSION_COLLECTION_EDITORIAL);
          this.createCurriculum=this.connector.hasToolPermissionInstant(RestConstants.TOOLPERMISSION_COLLECTION_CURRICULUM);
          this.mediacenterService.getMediacenters().subscribe((mediacenters) => {
            this.createMediacenter=mediacenters.filter((m)=>m.administrationAccess).length === 1;
            if(this.createMediacenter)
              this.mediacenter=mediacenters[0];
          });
          this.authorFreetextAllowed=this.connector.hasToolPermissionInstant(RestConstants.TOOLPERMISSION_COLLECTION_CHANGE_OWNER);

          this.iamService.getUser().subscribe((user : IamUser) => this.user=user.person);
          this.route.queryParams.subscribe(params => {
            this.mainnav=params['mainnav']!='false';
          });
          this.iamService.searchGroups("*",true,RestConstants.GROUP_TYPE_EDITORIAL, '', {count:RestConstants.COUNT_UNLIMITED}).subscribe((data:IamGroups)=>{
            this.editorialGroups=data.groups;
          });
          this.route.params.subscribe(params => {
            // get mode from route and validate input data
            let mode = params['mode'];
            let id = params['id'];
            if (mode=="edit") {
              this.collectionService.getCollection(id).subscribe((data)=>{
                this.nodeService.getNodeMetadata(id,[RestConstants.ALL]).subscribe((node:EduData.NodeWrapper)=>{
                  this.nodeService.getNodePermissions(id).subscribe((perm:EduData.NodePermissions)=>{
                    this.mdsSet = node.node.metadataset;
                    this.editorialGroupsSelected=this.getEditoralGroups(perm.permissions.localPermissions.permissions);
                    this.editorialPublic=perm.permissions.localPermissions?.permissions?.some(
                        (p: Permission) => p.authority?.authorityName === RestConstants.AUTHORITY_EVERYONE
                    );;
                    this.editId=id;
                    this.currentCollection = data.collection;
                    // cleanup irrelevant data
                    this.currentCollection.rating = null;
                    this.authorFreetext=this.currentCollection.collection.authorFreetext!=null;
                    this.originalPermissions=perm.permissions.localPermissions;
                    this.properties=node.node.properties;
                    this.newCollectionType=this.getTypeForCollection(this.currentCollection);
                    this.hasCustomScope=false;
                    this.newCollectionStep = this.STEP_GENERAL;
                    if(this.currentCollection.collection.scope === RestConstants.COLLECTIONSCOPE_CUSTOM_PUBLIC) {
                      this.currentCollection.collection.scope = RestConstants.COLLECTIONSCOPE_CUSTOM;
                    }
                    this.updateAvailableSteps();
                    this.isLoading=false;
                    GlobalContainerComponent.finishPreloading();
                  });
                });
              });
            } else {
              if(id==RestConstants.ROOT){
                this.setParent(id,null);
                return;
              }
              this.collectionService.getCollection(id).subscribe((data:EduData.CollectionWrapper)=>{
                this.setParent(id,data.collection);
              },(error:any)=>{
                this.setParent(id,null);
              });
            }
          });

        });
      });
    });
  }

    getShareStatus(){
      if(this.permissions || this.originalPermissions){
        let perms=this.permissions || this.originalPermissions;
        let type=RestConstants.COLLECTIONSCOPE_MY;
        if(perms && perms.permissions) {
            for (let perm of perms.permissions) {
                if (perm.authority.authorityName != this.user.authorityName) {
                    type = RestConstants.COLLECTIONSCOPE_CUSTOM;
                }
                if (perm.authority.authorityName == RestConstants.AUTHORITY_EVERYONE) {
                    type = RestConstants.COLLECTIONSCOPE_ALL;
                    break;
                }
            }
        }
        return type;
      }
      else{
        return RestConstants.COLLECTIONSCOPE_MY;
      }
    }
    private saveCollection(){
       this.collectionService.updateCollection(this.currentCollection).subscribe(()=>{
        this.navigateToCollectionId(this.currentCollection.ref.id);
      },(error:any)=> {
         this.nodeHelper.handleNodeError(this.currentCollection.title, error);
         //this.toast.error(error)
       });
    }
    setPermissions(permissions : any){
      if(permissions) {
        this.permissionsInfo = permissions;
        this.permissions = permissions.permissions;
        this.permissions.inherited=false;
        if(this.permissions.permissions && this.permissions.permissions.length){
          this.currentCollection.collection.scope=RestConstants.COLLECTIONSCOPE_CUSTOM;
          for(let permission of this.permissions.permissions){
            if(!permission.hasOwnProperty('editable')){
              permission.editable=true;
            }
          }
        }
      }
      this.showPermissions=false;
    }
    editPermissions(){
      if(this.permissions==null && !this.editId) {
        this.permissions = new LocalPermissions();
      }
      if(this.editId) {
        this.editPermissionsId = this.editId;
      }
      else{
        this.editPermissionsDummy=new EduData.Node();
        this.editPermissionsDummy.ref=new NodeRef();
        this.editPermissionsDummy.aspects=[RestConstants.CCM_ASPECT_COLLECTION];
        this.editPermissionsDummy.isDirectory=true;
      }
      console.log(this.permissions);
      this.showPermissions=true;
      // update state after changing different bindings
      this.uiService.waitForComponent(this, 'shareRef').subscribe(()=> this.shareRef.refresh());
    }
    isNewCollection() : boolean {
        return this.editId==null;
    }

    isEditCollection() : boolean {
        return !this.isNewCollection();
    }

    newCollectionCancel() : void {
        let id = this.parentId;
        if (id==null) id = this.editId;
        this.navigateToCollectionId(id);
    }

    setColor(color: string) : void {
        this.currentCollection.collection.color = color;
    }

    setColorByDirection(event: Event): void {
        const rowLength = 6;
        let index = this.COLORS.indexOf(this.currentCollection.collection.color);
        switch ((event as KeyboardEvent).key) {
            case 'ArrowUp': index -= rowLength; break;
            case 'ArrowDown': index += rowLength; break;
            case 'ArrowLeft': index -= 1; break;
            case 'ArrowRight': index += 1; break;
        }
        if (index >= 0 && index < this.COLORS.length) {
            this.setColor(this.COLORS[index]);
            event.preventDefault();
        }
    }

    imageDataChanged(event:any) : void {
        // get files and check if available
        let files = event.target.files;
        if (typeof files == "undefined") {
            return;
        }
        if (files.length<=0) {
            return;
        }

        // get first file
        let file:File = files[0];

        // check if file type is correct
        let validType = false;
        if (file.type.startsWith("image")) validType = true;
        //if (file.type=="image/jpeg") validType = true;
        //if (file.type=="image/gif") validType = true;
        if (!validType) {
            return;
        }


        // remember file for upload
        this.imageFile = file;
        this.imageData=this.sanitizer.bypassSecurityTrustUrl(URL.createObjectURL(file));
    }
    handleError(error:any){
      if(error.status==RestConstants.DUPLICATE_NODE_RESPONSE){
        this.toast.error(null,"COLLECTIONS.TOAST.DUPLICATE_NAME");
        return;
      }
      if(RestHelper.errorMessageContains(error,"Invalid property value")){
        this.toast.error(null,"COLLECTIONS.TOAST.INVALID_NAME");
        return;
      }
      this.toast.error(error);
    }
    save() : void {
        // input data optimize
        if(!this.currentCollection.collection.description)
          this.currentCollection.collection.description='';
        this.currentCollection.title = this.currentCollection.title.trim();
        this.currentCollection.collection.description = this.currentCollection.collection.description.trim();
        if(this.newCollectionType === RestConstants.COLLECTIONTYPE_EDITORIAL ||
            this.newCollectionType === RestConstants.COLLECTIONTYPE_MEDIA_CENTER) {
          this.currentCollection.collection.type = this.newCollectionType;
        }
        else{
          this.currentCollection.collection.type=RestConstants.COLLECTIONTYPE_DEFAULT;
        }
        if (this.isEditCollection()) {

            /*
             *  EDIT
             */

            this.isLoading = true;
            this.collectionService.updateCollection(this.currentCollection).subscribe(()=>{
              this.save2(this.currentCollection);
            }
            ,(error)=>{
              this.isLoading=false;
              this.handleError(error);
            });
        } else {

        /*
         *  CREATE
         */
          this.isLoading = true;
          this.collectionService.createCollection(
            this.currentCollection,
            this.parentId
          ).subscribe((collection:EduData.CollectionWrapper) => {
            this.save2(collection.collection);
          },(error:any)=>{
            this.isLoading=false;
            this.handleError(error);
          });
        }
    }
    private saveImage(collection: EduData.Node) : void {

       if (this.imageData!=null) {
           this.collectionService.uploadCollectionImage(collection.ref.id, this.imageFile, "image/png").subscribe(() => {
               this.navigateToCollectionId(collection.ref.id);
           });
       }
       else if(collection.preview==null) {
           this.collectionService.deleteCollectionImage(collection.ref.id).subscribe(() => {
               this.navigateToCollectionId(collection.ref.id);
           });
       }
       else {
          this.navigateToCollectionId(collection.ref.id);
        }
    }
    setCollectionType(type:string) {
      this.newCollectionType=type;
      if(type === RestConstants.COLLECTIONSCOPE_MY) {
        this.currentCollection.collection.scope=RestConstants.COLLECTIONSCOPE_MY;
      }
      if(type === RestConstants.COLLECTIONSCOPE_ALL) {
        this.currentCollection.collection.scope=RestConstants.COLLECTIONSCOPE_ALL;
      }
      if(type === RestConstants.COLLECTIONSCOPE_CUSTOM || type === RestConstants.COLLECTIONTYPE_EDITORIAL) {
        this.currentCollection.collection.scope=RestConstants.COLLECTIONSCOPE_CUSTOM;
      }
      if(type === RestConstants.COLLECTIONTYPE_MEDIA_CENTER) {
        this.switchToAuthorFreetext();
      }
      this.updateAvailableSteps();
      this.goToNextStep();
    }
    public getAvailableSteps(): Step[] {
      let steps: Step[] = [];
      steps.push(this.STEP_GENERAL);
      if(this.newCollectionType==RestConstants.COLLECTIONTYPE_EDITORIAL || this.newCollectionType==RestConstants.COLLECTIONTYPE_MEDIA_CENTER){
        steps.push(this.STEP_METADATA);
      }
      if(this.newCollectionType==RestConstants.COLLECTIONSCOPE_CUSTOM && this.canInvite){
        steps.push(this.STEP_PERMISSIONS);
      }
      if(this.newCollectionType==RestConstants.COLLECTIONTYPE_EDITORIAL){
        //steps.push(this.STEP_SETTINGS);
      }
      if(this.newCollectionType==RestConstants.COLLECTIONTYPE_EDITORIAL && this.canInvite){
        steps.push(this.STEP_EDITORIAL_GROUPS);
      }
      return steps;
    }
    public isLastStep(){
      let pos=this.currentStepPosition();
      return pos>=this.availableSteps.length-1;
    }
    public goToNextStep(){
      if(this.newCollectionStep==this.STEP_GENERAL){
          if(!this.currentCollection.title){
              this.toast.error(null,'COLLECTIONS.ENTER_NAME');
              return;
          }
      }
      if(this.newCollectionStep==this.STEP_METADATA){
          this.properties=this.mds.getValues({},true);
          if(this.properties==null)
              return;
      }
      if(this.isLastStep()){
        this.save();
      }
      else{
        let pos=this.currentStepPosition();
        this.newCollectionStep=this.availableSteps[pos+1];
        this.reloadMds=new Boolean(true);
      }
      this.updateButtons();
    }
    setCollectionGeneral(){

    }
    currentStepPosition(){
      return this.availableSteps.indexOf(this.newCollectionStep);
    }
    goBack(){
      if(this.newCollectionStep==this.STEP_METADATA){
          this.properties=this.mds.getValues({},false);
      }
       let pos=this.currentStepPosition();
       if(pos==-1){
         this.navigateToCollectionId(this.parentId);
       }
       else if(pos==0){
         if(this.editId) {
           this.navigateToCollectionId(this.editId);
         }
         else if(this.parentCollection && this.parentCollection.collection.type === RestConstants.COLLECTIONTYPE_EDITORIAL){
           this.navigateToCollectionId(this.parentId);
         }
         else {
           this.newCollectionStep = this.STEP_NEW;
         }
       }
       else{
         this.newCollectionStep = this.availableSteps[pos - 1];
         this.reloadMds=new Boolean(true);
       }
       this.updateButtons();
    }
    navigateToCollectionId(id:string) : void {
      this.isLoading = false;
      UIHelper.getCommonParameters(this.route).subscribe((params)=> {
        params.id=id;
        this.router.navigate([UIConstants.ROUTER_PREFIX + 'collections'], {
          queryParams:params
        });
      });
    }
  private save2(collection: EduData.Node) {
    if(this.newCollectionType === RestConstants.COLLECTIONTYPE_EDITORIAL ||
        this.newCollectionType === RestConstants.COLLECTIONTYPE_MEDIA_CENTER) {
      this.nodeService.AddNodeAspects(collection.ref.id,[RestConstants.CCM_ASPECT_LOMREPLICATION,RestConstants.CCM_ASPECT_CCLOM_GENERAL]).subscribe(()=> {
        this.nodeService.editNodeMetadata(collection.ref.id, this.properties).subscribe(() => {
          this.save3(collection);
        });
      });
    }
    else{
      this.save3(collection);
    }
  }
    public isBrightColor() {
        return ColorHelper.getPreferredColor(this.currentCollection.collection.color) === PreferredColor.White
    }
    private save3(collection:EduData.Node) {
    if(this.newCollectionType==RestConstants.GROUP_TYPE_EDITORIAL){
        // user has access to editorial group but can't invite (strange setting but may happens)
        if(!this.canInvite){
            this.save4(collection);
            return;
        }
        this.permissions=this.getEditorialGroupPermissions();
    }
    if((this.newCollectionType==RestConstants.COLLECTIONSCOPE_CUSTOM || this.newCollectionType==RestConstants.GROUP_TYPE_EDITORIAL) && this.permissions && this.permissions.permissions){
      if(this.originalPermissions && this.originalPermissions.inherited){
      }
      let permissions=RestHelper.copyAndCleanPermissions(this.permissions.permissions,this.originalPermissions ? this.originalPermissions.inherited : false);
      this.nodeService.setNodePermissions(collection.ref.id,permissions,this.permissionsInfo ? this.permissionsInfo.notify : false,this.permissionsInfo ? this.permissionsInfo.notifyMessage : null).subscribe(()=>{
        this.save4(collection);
      },(error)=>{
        this.toast.error(error);
        this.isLoading=false;
      });
    }
    else {
      this.save4(collection);
    }
  }

  private getTypeForCollection(collection: EduData.Node) {
    if(collection.collection.type === RestConstants.COLLECTIONTYPE_EDITORIAL ||
        collection.collection.type === RestConstants.COLLECTIONTYPE_MEDIA_CENTER) {
      return collection.collection.type;
    }
    if(collection.collection.scope === RestConstants.COLLECTIONSCOPE_MY && !this.canInvite) {
      return RestConstants.COLLECTIONSCOPE_MY;
    }
    if(collection.collection.scope === RestConstants.COLLECTIONSCOPE_MY ||
        collection.collection.scope === RestConstants.COLLECTIONSCOPE_ORGA ||
        collection.collection.scope === RestConstants.COLLECTIONSCOPE_ALL ||
        collection.collection.scope=== RestConstants.COLLECTIONSCOPE_CUSTOM_PUBLIC) {
      return RestConstants.COLLECTIONSCOPE_CUSTOM;
    }
    return collection.collection.scope;
  }

  private updateAvailableSteps() {
    this.availableSteps=this.getAvailableSteps();
    this.updateButtons();
  }

  private getEditorialGroupPermissions() {
    const permissions=new LocalPermissions();
    permissions.permissions=[];
    if(this.editorialPublic) {
        const pub=RestHelper.getAllAuthoritiesPermission();
        pub.permissions = [RestConstants.PERMISSION_CONSUMER];
        permissions.permissions.push(pub);
    }
    for(const group of this.editorialGroupsSelected){
      const perm=new Permission();
      perm.authority={authorityName:group.authorityName,authorityType:group.authorityType};
      perm.permissions=[RestConstants.PERMISSION_COORDINATOR];
      permissions.permissions.push(perm);
    }
    return permissions;
  }

  private getEditoralGroups(permissions: Permission[]) {
    let list:Group[]=[];
    for(let perm of permissions){
      for(let group of this.editorialGroups){
        if(group.authorityName==perm.authority.authorityName){
          list.push(group);
        }
      }
    }
    return list;
  }

  private setParent(id:string,parent: EduData.Node) {
    this.parentId = id;
    this.parentCollection = parent;
    this.currentCollection=new EduData.Node();
    this.currentCollection.title='';
    this.currentCollection.collection = ({
      description: '',
      color: this.COLORS[0]
    } as any);
      if(this.parentCollection &&
          this.parentCollection.collection.type === RestConstants.COLLECTIONTYPE_EDITORIAL) {
          if(!this.createEditorial || !this.shareToAll){
            this.toast.error(
                this.createEditorial ? RestConstants.TOOLPERMISSION_INVITE_ALLAUTHORITIES : RestConstants.TOOLPERMISSION_COLLECTION_EDITORIAL,
                'TOOLPERMISSION_ERROR'
            );
            window.history.back();
            this.isLoading = false;
            return;
          }
          this.setCollectionType(RestConstants.COLLECTIONTYPE_EDITORIAL);
      }
    this.updateAvailableSteps();
    this.isLoading=false;
    GlobalContainerComponent.finishPreloading();
  }

  private save4(collection: EduData.Node) {
    // check if there are any nodes that should be added to this collection
    const add: {nodes: EduData.Node[], callback: EventEmitter<any>} = this.temporaryStorage.pop(TemporaryStorageService.COLLECTION_ADD_NODES);
    if(!add) {
        this.saveImage(collection);
        return;
    }
    UIHelper.addToCollection(this.nodeHelper, this.collectionService,this.router,this.bridge,collection,add.nodes,(references) => {
        this.saveImage(collection);
        add.callback?.emit({collection, references});
        return;
    });
  }

    deleteImage() {
      this.imageData = null;
      this.imageFile = null;
      this.imageFileRef.nativeElement.value = null;
      this.currentCollection.preview = null;
    }

    private updateButtons() {
        /**
         *  <a class="waves-effect btn" tabindex="0" (keyup.enter)="setCollectionGeneral()" (click)="setCollectionGeneral()">
         <span>{{(isLastStep() ? 'SAVE' : 'NEXT') | translate }}</span>
         </a>
         <a class="waves-effect waves-light btn-flat" tabindex="0" (keyup.enter)="goBack()" (click)="goBack()">{{ 'BACK' | translate }}</a>

         */
        this.buttons=[
            new DialogButton('BACK',DialogButton.TYPE_CANCEL,()=>this.goBack()),
            new DialogButton(this.isLastStep() ? 'SAVE' : 'NEXT',DialogButton.TYPE_PRIMARY,()=>this.goToNextStep())
        ]
    }

  switchToAuthorFreetext() {
    this.authorFreetextAllowed=this.connector.hasToolPermissionInstant(RestConstants.TOOLPERMISSION_COLLECTION_CHANGE_OWNER);
    this.authorFreetext=true;
    this.currentCollection.collection.authorFreetext=new AuthorityNamePipe(this.translationService).transform(
        this.newCollectionType === RestConstants.COLLECTIONTYPE_MEDIA_CENTER ||
        this.currentCollection.collection.type === RestConstants.COLLECTIONTYPE_MEDIA_CENTER ?
            this.mediacenter : this.user,null);
    setTimeout(() => {
        this.authorFreetextInput.nativeElement.focus();
    });
  }

  cancelAuthorFreetext() {
    this.authorFreetext=false;
    this.currentCollection.collection.authorFreetext=null;
  }
}
