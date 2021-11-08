import {Component, EventEmitter, HostListener, Input, Output, ViewChild} from '@angular/core';
import {
  Authority,
  ConfigurationService,
  DialogButton,
  Group,
  IamAuthorities,
  IamGroups,
  IamUsers,
  ListItem,
  NodeList,
  Organization, GroupSignupDetails,
  OrganizationOrganizations,
  RestConnectorService,
  RestConstants,
  RestIamService,
  RestNodeService,
  RestOrganizationService,
  SharedFolder, UIService,
  User,
  UserSimple, Person
} from '../../../core-module/core.module';
import {Toast} from '../../../core-ui-module/toast';
import {Router} from '@angular/router';
import {TranslateService} from '@ngx-translate/core';
import {Constrain, CustomOptions, DefaultGroups, ElementType, OptionGroup, OptionItem} from '../../../core-ui-module/option-item';
import {UIAnimation} from '../../../core-module/ui/ui-animation';
import {SuggestItem} from '../../../common/ui/autocomplete/autocomplete.component';
import {Helper} from '../../../core-module/rest/helper';
import {trigger} from '@angular/animations';
import {UIHelper} from '../../../core-ui-module/ui-helper';
import {ModalDialogOptions} from '../../../common/ui/modal-dialog-toast/modal-dialog-toast.component';
import {ActionbarComponent} from '../../../common/ui/actionbar/actionbar.component';
import {ListTableComponent} from '../../../core-ui-module/components/list-table/list-table.component';
import {Observable} from 'rxjs';
import {NodeHelperService} from '../../../core-ui-module/node-helper.service';
import {ActionbarHelperService} from '../../../common/services/actionbar-helper';
import {CsvHelper} from '../../../core-module/csv.helper';
import {ListItemType} from '../../../core-module/ui/list-item';
import {VCard} from "../../../core-module/ui/VCard";

@Component({
  selector: 'permissions-authorities',
  templateUrl: 'authorities.component.html',
  styleUrls: ['authorities.component.scss'],
  animations: [
	trigger('fromRight', UIAnimation.fromRight()),
	trigger('fade', UIAnimation.fade()),
    trigger('cardAnimation', UIAnimation.cardAnimation())
  ]
})
export class PermissionsAuthoritiesComponent {
  @ViewChild('actionbar') actionbar: ActionbarComponent;
  @ViewChild('actionbarMember') actionbarMember: ActionbarComponent;
  @ViewChild('listRef') listRef: ListTableComponent;
  @ViewChild('addToComponent') addToComponent: PermissionsAuthoritiesComponent;
  public GROUP_TYPES= RestConstants.VALID_GROUP_TYPES;
  public STATUS_TYPES= RestConstants.VALID_PERSON_STATUS_TYPES;
  public SCOPE_TYPES= RestConstants.VALID_SCOPE_TYPES;
  public ORG_TYPES= RestConstants.VALID_GROUP_TYPES_ORG;
  public PRIMARY_AFFILIATIONS= RestConstants.USER_PRIMARY_AFFILIATIONS;
  public list: any[]= [];
  public edit: any;
  editDetails: any;
  editId: string;
  private offset = 0;
  public columns: ListItem[]= [];
  public addMemberColumns: ListItem[]= [];
  public editGroupColumns: ListItem[]= [];
  public sortBy: string;
  public sortAscending = true;
  public loading = true;
  public _searchQuery: string;
  manageMemberSearch: string;
  public options: CustomOptions= {
    useDefaultOptions: false,
    addOptions: []
  };
  public toolpermissionAuthority: any;
  public optionsActionbar: OptionItem[];
  private orgs: OrganizationOrganizations;
  public addMembers: any;
  public editGroups: User;
  memberOptions: CustomOptions = {
    useDefaultOptions: false,
    addOptions: []
  };
  private addToList: any[];
  isAdmin = false;
  embeddedQuery: string;
  editButtons: DialogButton[];
  memberButtons: DialogButton[];
  signupButtons: DialogButton[];
  signupListButtons: DialogButton[];
  editStatus: UserSimple;
  editStatusNotify = true;
  editStatusButtons: DialogButton[];
  hasMore: boolean;
  groupSignup: Organization;
  groupSignupList: UserSimple[];
  groupSignupDetails: GroupSignupDetails;
  private _org: Organization;
  @Output() onDeselectOrg = new EventEmitter();
  @Input() set searchQuery(searchQuery: string){
    this._searchQuery = searchQuery;
    // wait for other data to be initalized
    setTimeout(()=>
      this.search()
    );
  }
  @Input() selected: Organization[]|Group[]|UserSimple[] = [];

  public _mode: ListItemType;
  public addTo: any;
  addToSelection: any;
  public globalProgress= false;
  @Input() set org(org: Organization){
    this._org = org;
    // this.refresh();
  }
  get org(){
    return this._org;
  }
  @Input() embedded = false;
  @Output() onSelection = new EventEmitter();
  @Output() setTab = new EventEmitter<number>();
  public editMembers: any;
  memberList: Authority[];
  selectedMembers: Authority[]= [];
  private memberSugesstions: SuggestItem[];
  private memberListOffset: number;
  // show primary affiliations as list (or free text)
  primaryAffiliationList = true;
  signupActions: CustomOptions = {
    useDefaultOptions: false,
  };
  groupSignupSelected: UserSimple[] = [];
  private updateMemberSuggestions(event: any){
    if (this.editMembers == this.org || this.org == null){
      this.iam.searchUsers(event.input).subscribe(
        (users: IamUsers) => {
          const ret: SuggestItem[] = [];
          for (const user of users.users){
            const item = new SuggestItem(user.authorityName, user.profile.firstName + ' ' + user.profile.lastName, 'person', '');
            item.originalObject = user;
            ret.push(item);
          }
          this.memberSugesstions = ret;
        },
        error => console.log(error));
    }
    else {
      this.iam.getGroupMembers(this.org.authorityName, event.input, 'USER').subscribe(
        (users: IamAuthorities) => {
          const ret: SuggestItem[] = [];
          for (const user of users.authorities) {
            const item = new SuggestItem(user.authorityName, user.profile.firstName + ' ' + user.profile.lastName, 'person', '');
            item.originalObject = user;
            ret.push(item);
          }
          this.memberSugesstions = ret;
        },
        error => console.log(error));
    }

  }
  private addMember(event: any){
    if (this.editMembers == 'ALL'){
      this.iam.addGroupMember(this.org.authorityName, event.item.id).subscribe(() => {
        this.memberList = [];
        this.memberListOffset = 0;
        this.searchMembers();
      }, (error: any) => this.handleError(error));
    }
    else {
      this.iam.addGroupMember((this.editMembers as Group).authorityName, event.item.id).subscribe(() => {
        this.memberList = [];
        this.memberListOffset = 0;
        this.searchMembers();
      }, (error: any) => this.handleError(error));
    }
  }
  @Input() set mode(mode: ListItemType){
   this._mode = mode;
   if (mode == 'USER'){
     this.sortBy = 'firstName';

   }
   else {
     this.sortBy = 'displayName';
   }
   this.columns = this.getColumns(mode, this.embedded);
   this.addMemberColumns = this.getColumns('USER', true);
   this.editGroupColumns = this.getColumns('GROUP', true);
   // will be called by searchQuery
   // this.loadAuthorities();
  }
  private getMemberOptions(): OptionItem[] {
    const options: OptionItem[] = [];
    const removeMembership = new OptionItem('PERMISSIONS.MENU_REMOVE_MEMBERSHIP', 'delete', (data) =>
        this.deleteMembership(NodeHelperService.getActionbarNodes(this.selectedMembers, data))
    );
    removeMembership.constrains = [Constrain.User];
    removeMembership.group = DefaultGroups.Delete;
    removeMembership.elementType = [ElementType.Group];
    options.push(removeMembership);
    const removeFromGroup = new OptionItem('PERMISSIONS.MENU_REMOVE_MEMBER', 'delete', (data) =>
        this.deleteMember(NodeHelperService.getActionbarNodes(this.selectedMembers, data))
    );
    removeFromGroup.constrains = [Constrain.User];
    removeFromGroup.group = DefaultGroups.Delete;
    removeFromGroup.elementType = [ElementType.Person];
    options.push(removeFromGroup);
    return options;
  }

  private getColumns(mode: ListItemType, fromDialog= false){
    const columns: ListItem[] = [];
    if (mode == 'USER'){
      columns.push(new ListItem(mode, RestConstants.AUTHORITY_NAME));
      columns.push(new ListItem(mode, RestConstants.AUTHORITY_FIRSTNAME));
      columns.push(new ListItem(mode, RestConstants.AUTHORITY_LASTNAME));
      if (!fromDialog) {
        columns.push(new ListItem(mode, RestConstants.AUTHORITY_EMAIL));
        columns.push(new ListItem(mode, RestConstants.AUTHORITY_STATUS));
      }
    }
    else if (mode == 'GROUP'){
      columns.push(new ListItem(mode, RestConstants.AUTHORITY_DISPLAYNAME));
      if (!fromDialog)
        columns.push(new ListItem(mode, RestConstants.AUTHORITY_GROUPTYPE));
    }
    else {
      columns.push(new ListItem(mode, RestConstants.AUTHORITY_DISPLAYNAME));
    }
    return columns;
  }
  constructor(private toast: Toast,
              private node: RestNodeService,
              private config: ConfigurationService,
              private nodeHelper: NodeHelperService,
              private uiService: UIService,
              private router: Router,
              private translate: TranslateService,
              private organization: RestOrganizationService,
              private connector: RestConnectorService,
              private iam: RestIamService) {
      this.isAdmin = this.connector.getCurrentLogin()?.isAdmin;
      this.organization.getOrganizations().subscribe((data: OrganizationOrganizations) => {
      this.updateOptions();
      this.updateButtons();

    });
  }
  private search(){
    this.refresh();
  }
  public changeSort(event: any){
    //this.sortBy=event.sortBy;
    if (this._mode == 'GROUP' || this._mode == 'USER'){
      this.sortBy = event.sortBy;
    }
    this.sortAscending = event.sortAscending;
    this.offset = 0;
    this.list = [];
    this.loadAuthorities();
  }
  public selection(data: any) {
    this.selected = data;
    this.onSelection.emit(data);
  }
  private getList<T>(data: T): T[] {
    return NodeHelperService.getActionbarNodes((this.selected as any), data);
  }
  private updateOptions() {
    if (this.embedded) {
      this.options.addOptions = [];
      return;
    }
    const options: OptionItem[] = [];
    if (this._mode === 'ORG') {
      const global = new OptionItem('PERMISSIONS.MENU_TOOLPERMISSIONS_GLOBAL', 'playlist_add_check', (data: any) =>
          this.toolpermissionAuthority = RestConstants.getAuthorityEveryone()
      );
      global.elementType = [ElementType.Unknown];
      global.group = DefaultGroups.Primary;
      global.priority = 10;
      global.constrains = [Constrain.Admin, Constrain.NoSelection];
      options.push(global);
    }
    if (this._mode === 'GROUP') {
      const createGroup = new OptionItem('PERMISSIONS.MENU_CREATE_GROUP', 'add', (data) =>
          this.createGroup()
      );
      createGroup.elementType = [ElementType.Unknown];
      createGroup.group = DefaultGroups.Primary;
      createGroup.constrains = [Constrain.Admin, Constrain.NoSelection];
      options.push(createGroup);
    }
    if (this._mode === 'USER') {
      if (this.org) {
        const addUser = new OptionItem('PERMISSIONS.MENU_ADD_GROUP_MEMBERS', 'person_add', (data: any) => this.addMembersFunction(this.org));
        addUser.elementType = [ElementType.Unknown];
        addUser.group = DefaultGroups.Primary;
        addUser.priority = 10;
        addUser.constrains = [Constrain.NoSelection];
        options.push(addUser);
      }
      if (this.orgs) {
        const createAuthority = new OptionItem('PERMISSIONS.MENU_CREATE_USER', 'add', (data: any) => this.createAuthority());
        createAuthority.elementType = [ElementType.Unknown];
        createAuthority.group = DefaultGroups.Primary;
        createAuthority.priority = 10;
        createAuthority.constrains = [Constrain.Admin, Constrain.NoSelection];
        options.push(createAuthority);
      }
      const download = new OptionItem('PERMISSIONS.EXPORT_MEMBER', 'cloud_download', (data: any) => this.downloadMembers());
      download.onlyDesktop = true;
      download.elementType = [ElementType.Unknown];
      download.group = DefaultGroups.Primary;
      download.priority = 10;
      download.constrains = [Constrain.NoSelection];
      options.push(download);
    }

    if (this._mode === 'ORG' && this.orgs && this.orgs.canCreate) {
      const newOrg = new OptionItem('PERMISSIONS.ADD_ORG', 'add', (data) =>
          this.createOrg()
      );
      newOrg.elementType = [ElementType.Unknown];
      newOrg.group = DefaultGroups.Primary;
      newOrg.priority = 20;
      newOrg.constrains = [Constrain.Admin, Constrain.NoSelection];
      options.push(newOrg);
    }
    const orgSignupList = new OptionItem('PERMISSIONS.ORG_SIGNUP_LIST', 'playlist_add', async (data) => {
      this.toast.showProgressDialog();
      this.groupSignup = this.getList(data)[0];
      this.groupSignupSelected = [];
      this.groupSignupList = (await this.iam.getGroupSignupList(this.groupSignup.authorityName).toPromise());
      this.toast.closeModalDialog();
    });
    orgSignupList.elementType = [ElementType.Group];
    orgSignupList.group = DefaultGroups.Edit;
    orgSignupList.customShowCallback = (nodes) => {
      return nodes[0].signupMethod === 'list';
    };
    orgSignupList.priority = 20;
    orgSignupList.constrains = [Constrain.Admin, Constrain.NoBulk];
    options.push(orgSignupList);
    const orgSignup = new OptionItem('PERMISSIONS.ORG_SIGNUP', 'checkbox', (data) => {
          this.groupSignup = this.getList(data)[0];
          this.groupSignupDetails = {
            signupMethod: this.getList(data)[0].signupMethod ?? 'disabled',
            signupPassword: ''
          }
        }
    );
    orgSignup.elementType = [ElementType.Group];
    orgSignup.group = DefaultGroups.Edit;
    orgSignup.priority = 30;
    orgSignup.constrains = [Constrain.Admin, Constrain.NoBulk];
    options.push(orgSignup);
    const addToGroup = new OptionItem('PERMISSIONS.MENU_ADD_TO_GROUP', 'group_add', (data) =>
        this.addToGroup(data)
    );
    addToGroup.elementType = [ElementType.Person];
    addToGroup.group = DefaultGroups.Primary;
    addToGroup.priority = 10;
    addToGroup.constrains = [Constrain.User];
    options.push(addToGroup);
    const manageMemberships = new OptionItem('PERMISSIONS.MENU_EDIT_GROUPS', 'group', (data) =>
        this.openEditGroups(data)
    );
    manageMemberships.elementType = [ElementType.Person];
    manageMemberships.group = DefaultGroups.Primary;
    manageMemberships.priority = 20;
    manageMemberships.constrains = [Constrain.User, Constrain.NoBulk];
    options.push(manageMemberships);

    if (this._mode === 'GROUP') {
      const addMembers = new OptionItem('PERMISSIONS.MENU_ADD_GROUP_MEMBERS', 'group_add', (data: any) =>
          this.addMembersFunction(data)
      );
      addMembers.elementType = [ElementType.Group];
      addMembers.group = DefaultGroups.Primary;
      addMembers.constrains = [Constrain.NoBulk, Constrain.User];
      options.push(addMembers);
      const manageMembers = new OptionItem('PERMISSIONS.MENU_MANAGE_GROUP', 'group', (data: any) => this.manageMembers(data));
      manageMembers.elementType = [ElementType.Group];
      manageMembers.group = DefaultGroups.Primary;
      manageMembers.constrains = [Constrain.NoBulk, Constrain.User];
      options.push(manageMembers);
    }
    if (this._mode === 'GROUP' || this.orgs && this.orgs.canCreate) {
      const editGroup = new OptionItem('PERMISSIONS.MENU_EDIT_GROUP', 'edit', (data: any) => this.editAuthority(data));
      editGroup.constrains = [Constrain.Admin, Constrain.NoBulk];
      editGroup.elementType = [ElementType.Group];
      editGroup.group = DefaultGroups.Edit;
      editGroup.priority = 10;
      options.push(editGroup);
    }
    if(this.orgs && this.orgs.canCreate) {
      const edit = new OptionItem('PERMISSIONS.MENU_EDIT_PERSON', 'edit', (data: any) => this.editAuthority(data));
      edit.constrains = [Constrain.Admin, Constrain.NoBulk];
      edit.elementType = [ElementType.Person];
      edit.group = DefaultGroups.Edit;
      edit.priority = 10;
      options.push(edit);
    }

    const manage = new OptionItem('PERMISSIONS.MENU_TOOLPERMISSIONS', 'playlist_add_check', (data: any) => {
      this.toolpermissionAuthority = this.getList(data)[0];
    });
    manage.constrains = [Constrain.Admin, Constrain.NoBulk];
    manage.elementType = [ElementType.Group, ElementType.Person];
    manage.group = DefaultGroups.Reuse;
    options.push(manage);

    if (this._mode === 'GROUP') {
      const removeGroup = new OptionItem('PERMISSIONS.MENU_DELETE', 'delete', (data: any) =>
          this.deleteAuthority(data, (list: any) => this.startDelete(list))
      );
      removeGroup.constrains = [Constrain.Admin];
      removeGroup.elementType = [ElementType.Group];
      removeGroup.group = DefaultGroups.Delete;
      options.push(removeGroup);
    }
    const personStatus = new OptionItem('PERMISSIONS.MENU_STATUS', 'check', (data: any) =>
        this.setPersonStatus(this.getList(data)[0])
    );
    personStatus.constrains = [Constrain.NoBulk, Constrain.Admin];
    personStatus.elementType = [ElementType.Person];
    personStatus.group = DefaultGroups.Edit;
    options.push(personStatus);
    if (this.org) {
      const excludePerson = new OptionItem('PERMISSIONS.MENU_EXCLUDE', 'delete', (data: any) => this.startExclude(this.getList(data)));
      excludePerson.constrains=[Constrain.User];
      excludePerson.elementType = [ElementType.Person];
      excludePerson.group = DefaultGroups.Delete;
      options.push(excludePerson);
    }
    if (this._mode === 'ORG' && this.orgs && this.orgs.canCreate) {
      const remove = new OptionItem('PERMISSIONS.MENU_DELETE', 'delete', (data: any) => this.deleteAuthority(data, (list: any) => this.deleteOrg(list)));
      remove.group = DefaultGroups.Delete;
      remove.elementType = [ElementType.Group];
      remove.constrains = [Constrain.Admin];
      options.push(remove);
    }

    this.options.addOptions = options;
    if (this.listRef) {
      this.listRef.refreshAvailableOptions();
    }

    const signupAdd = new OptionItem('PERMISSIONS.ORG_SIGNUP_ADD', 'person_add', (node: UserSimple) => {
      this.toast.showProgressDialog();
      const users = NodeHelperService.getActionbarNodes(this.groupSignupSelected, node);
      Observable.forkJoin(users.map((u) =>
          this.iam.confirmSignup(this.groupSignup.authorityName, u.authorityName)
      )).subscribe(() => {
        this.groupSignupList = null;
        this.toast.toast('PERMISSIONS.ORG_SIGNUP_ADD_CONFIRM');
        this.toast.closeModalDialog();
      }, error => {
        this.toast.error(error);
        this.toast.closeModalDialog();
      })
    });
    signupAdd.elementType = [ElementType.Person];
    signupAdd.group = DefaultGroups.Primary;
    const signupRemove = new OptionItem('PERMISSIONS.ORG_SIGNUP_REJECT', 'close', (node: UserSimple) => {
        this.toast.showProgressDialog();
        const users = NodeHelperService.getActionbarNodes(this.groupSignupSelected, node);
        Observable.forkJoin(users.map((u) =>
            this.iam.rejectSignup(this.groupSignup.authorityName, u.authorityName)
        )).subscribe(() => {
          this.groupSignupList = null;
          this.toast.toast('PERMISSIONS.ORG_SIGNUP_REJECT_CONFIRM');
          this.toast.closeModalDialog();
        }, error => {
          this.toast.error(error);
          this.toast.closeModalDialog();
        })
    });
    signupRemove.elementType = [ElementType.Person];
    signupRemove.group = DefaultGroups.Delete;
    this.signupActions.addOptions = [signupAdd, signupRemove];
  }
  cancelEdit(){
    this.edit = null;
  }
  cancelAddTo(){
    this.addTo = null;
  }
  cancelEditMembers(){
    this.editMembers = null;
    this.addMembers = null;
    this.editGroups = null;
    // this.refresh();
  }
  private addMembersToGroup(){
    this.globalProgress = true;
    this.addToSelection = [this.addMembers];
    this.addToList = this.selectedMembers;
    this.addMembers = null;

    this.addToSingle(() => this.refresh());
  }
  private checkOrgExists(orgName: string){
    this.organization.getOrganizations(orgName, false).subscribe((data: OrganizationOrganizations) => {
      if (data.organizations.length){
        this.closeDialog()
        this.toast.toast('PERMISSIONS.ORG_CREATED');
        this.refresh();
      }
      else{
        setTimeout(() => this.checkOrgExists(orgName), 2000);
      }
    });

  }
  private saveEdits(){
    if (this._mode == 'GROUP' || this._mode == 'ORG'){
      if (this.editId == null){
        const name = this.edit.profile.displayName;
        const profile = this.edit.profile;
        if (this._mode == 'ORG'){
          this.globalProgress = true;
          this.organization.createOrganization(name).subscribe((result) => {
            this.edit = null;
            this.iam.editGroup(result.authorityName, profile).subscribe(() => {
              this.globalProgress = false;
              this.toast.showProgressDialog('PERMISSIONS.ORG_CREATING','PERMISSIONS.ORG_CREATING_INFO');
              setTimeout(() => this.checkOrgExists(name), 2000);
            }, (error) => {
              this.toast.error(error);
              this.globalProgress = false;
            });
          },
            (error) => {
              this.toast.error(error);
              this.globalProgress = false;
            });
        }
        else {
          this.globalProgress = true;
          this.iam.createGroup(name, this.edit.profile, this.org ? this.org.groupName : '').subscribe(() => {
            this.edit = null;
            this.globalProgress = false;
            this.toast.toast('PERMISSIONS.GROUP_CREATED');
            this.refresh();
          }, (error: any) => {
            this.toast.error(error);
            this.globalProgress = false;
          });
        }
        return;
      }
      this.iam.editGroup(this.editId, this.edit.profile).subscribe(() => {
        this.edit = null;
        this.toast.toast('PERMISSIONS.GROUP_EDITED');
        this.refresh();
      },
        (error: any) => this.toast.error(error));
    }
    else {
      const editStore = Helper.deepCopy(this.edit);
      if(this.edit.profile?.vcard) {
          editStore.profile.vcard = this.edit.profile.vcard.copy();
      }
      editStore.profile.sizeQuota *= 1024 * 1024;
      this.globalProgress = true;
      if (this.editId == null){
        const name = this.editDetails.authorityName;
        const password = this.editDetails.password;
        this.iam.createUser(name, password, editStore.profile).subscribe(() => {
            this.edit = null;
            this.globalProgress = false;
            if (this.org){
              this.iam.addGroupMember(this.org.authorityName, name).subscribe(() => {
                this.toast.toast('PERMISSIONS.USER_CREATED');
                this.refresh();
              }, (error: any) => this.toast.error(error));
            }
            else{
              this.toast.toast('PERMISSIONS.USER_CREATED');
              this.refresh();
            }

          },
          (error: any) => {
            this.toast.error(error);
            this.globalProgress = false;
          });
      }
      else {
        this.iam.editUser(this.editId, editStore.profile).subscribe(() => {
            this.edit = null;
            this.toast.toast('PERMISSIONS.USER_EDITED');
            this.refresh();
            this.globalProgress = false;
          },
          (error: any) => {
            this.toast.error(error);
            this.globalProgress = false;
          });
      }
    }
  }
  public loadAuthorities() {
    this.loading = true;
    let sort = RestConstants.AUTHORITY_NAME;
    if (this._mode == 'ORG') {
        sort = RestConstants.CM_PROP_AUTHORITY_DISPLAYNAME;
    }
    if (this._mode == 'GROUP' && !this.org) {
      sort = this.sortBy;
      if (sort == RestConstants.AUTHORITY_DISPLAYNAME){
        sort = RestConstants.CM_PROP_AUTHORITY_DISPLAYNAME;
      }
      if (sort == RestConstants.AUTHORITY_GROUPTYPE) {
        sort = RestConstants.CCM_PROP_AUTHORITY_GROUPTYPE;
      }
    } else  if (this._mode == 'USER' && !this.org) {
        sort = this.sortBy;
        if(sort === RestConstants.AUTHORITY_STATUS){
            sort = RestConstants.CM_ESPERSONSTATUS;
        }
    }

    const request = {sortBy: [sort], sortAscending: this.sortAscending, offset: this.offset};
    const query = this._searchQuery ? this._searchQuery : '';
    this.organization.getOrganizations(query, false).subscribe((orgs: OrganizationOrganizations) => {
      this.orgs = orgs;
      this.updateOptions();
    });
    if (this._mode === 'ORG') {
        // as non-admin, search only own orgs since these are the once with access
      this.organization.getOrganizations(query, !this.isAdmin, request).subscribe((orgs: OrganizationOrganizations) => {
        this.offset += this.connector.numberPerRequest;
        for (const org of orgs.organizations) {
          if (org.administrationAccess) {
            this.list.push(org);
          }
        }
        // org endpoint does not support proper pagination, so check if result was empty
        this.hasMore = orgs.organizations.length > 0;
        this.loading = false;
        this.updateOptions();
      });
    }/*
    else if(this._mode=='USER'){
      this.iam.searchUsers(this.query,request).subscribe((users : IamUsers) => {
        this.offset+=this.connector.numberPerRequest;
        for(let user of users.users)
          this.list.push(user);
        this.loading=false;
      });
    }
    else{
      this.iam.searchGroups(this.query,request).subscribe((groups : IamGroups) => {
        this.offset+=this.connector.numberPerRequest;
        for(let group of groups.groups)
          this.list.push(group);
        this.loading=false;
      });
    }*/
    else{
      if (this.org) {
        this.offset += this.connector.numberPerRequest;
        this.iam.getGroupMembers(this.org.authorityName, query, this._mode, request).subscribe((data: IamAuthorities) => {
          for (const auth of data.authorities) {
              this.list.push(auth);
          }
          // org endpoint does not support proper
          this.hasMore = this.list.length < data.pagination.total;
          this.loading = false;
        });
      }
      else if (this._mode == 'GROUP'){
        this.offset += this.connector.numberPerRequest;
        this.iam.searchGroups(query, true, '', '', request).subscribe((data: IamGroups) => {
          for (const auth of data.groups) {
              this.list.push(auth);
          }
          this.hasMore = this.list.length < data.pagination.total;
          this.loading = false;
        });
      }
      else if (this._mode == 'USER'){
        this.offset += this.connector.numberPerRequest;
        this.iam.searchUsers(query, true, '', request).subscribe((data: IamUsers) => {
          for (const auth of data.users) {
              this.list.push(auth);
          }
          this.hasMore = this.list.length < data.pagination.total;
          this.loading = false;
        });
      }
    }
  }

  private editAuthority(data: any) {
    const list = this.getList(data);

    if (this._mode == 'ORG'){
      this.node.getNodeParents(list[0].sharedFolder.id, true).subscribe((data: NodeList) => {
        this.edit = Helper.deepCopy(list[0]);
        this.edit.folder = '';
        data.nodes = data.nodes.reverse().slice(1);
        for (const node of data.nodes){
          this.edit.folder += node.name + '/';
        }
        this.editId = this.edit.authorityName;
      }, (error: any) => this.toast.error(error));
    }
    else if (this._mode == 'USER'){
      this.iam.getUser(list[0].authorityName).subscribe((user) => {
          this.edit = user.person;
          this.edit.profile.sizeQuota = user.person.quota.sizeQuota / 1024 / 1024;
          this.editId = this.edit.authorityName;
          this.primaryAffiliationList = this.edit.profile.primaryAffiliation ? this.PRIMARY_AFFILIATIONS.indexOf(this.edit.profile.primaryAffiliation) != -1 : true;
      });
    }
    else {
      this.edit = Helper.deepCopy(list[0]);
      this.editId = this.edit.authorityName;
    }
    this.updateButtons();
  }
  private addToGroup(data: any) {
    const list = this.getList(data);

    this.addTo = list;
    this.addToSelection = null;
    this.uiService.waitForComponent(this,'addToComponent').subscribe(()=> this.addToComponent.loadAuthorities());
  }
  private openEditGroups(data: User) {
      const list = this.getList(data);
      this.editGroups = list[0];
      this.manageMemberSearch = '';
      this.memberList = [];
      this.memberListOffset = 0;
      this.searchMembers();
  }
  addToSelect() {
    this.addToList = this.selected;
    this.addToSingle();
  }
  private addToSingle(callback: Function= null, position = 0, groupPosition= 0, errors= 0){
    if (position == this.addToList.length){
      if (groupPosition < this.addToSelection.length - 1){
        this.addToSingle(callback, 0, groupPosition + 1, errors);
      }
      else {
        if (groupPosition == 0) {
          if (errors)
            this.toast.toast('PERMISSIONS.USER_ADDED_FAILED', {
              count: position - errors,
              error: errors,
              group: this.addToSelection[0].profile.displayName
            });
          else
            this.toast.toast('PERMISSIONS.USER_ADDED_TO_GROUP', {
              count: position,
              group: this.addToSelection[0].profile.displayName
            });
        }
        else{
          const count = this.addToList.length * this.addToSelection.length;
          if (errors)
            this.toast.toast('PERMISSIONS.USER_ADDED_FAILED_MULTI', {
              count: count - errors,
              error: errors,
            });
          else
            this.toast.toast('PERMISSIONS.USER_ADDED_TO_GROUP_MULTI', {
              count,
            });
        }

        this.addTo = null;
        this.globalProgress = false;
        if (callback)
          callback();
      }
      return;
    }
    this.globalProgress = true;
    this.iam.addGroupMember(this.addToSelection[groupPosition].authorityName, this.addToList[position].authorityName).subscribe(() => {
      this.addToSingle(callback, position + 1, groupPosition, errors);
    },
      (error: any) => {
        if (error.status == RestConstants.DUPLICATE_NODE_RESPONSE) {
          errors++;
        }
        else {
          this.toast.error(error);
        }
        this.addToSingle(callback, position + 1, groupPosition, errors);
      }
    );

  }
  private deleteAuthority(data: any, callback: Function) {
    const list = this.getList(data);
    if (this._mode == 'GROUP' && list.filter((l) => l.groupType == RestConstants.GROUP_TYPE_ADMINISTRATORS).length){
        this.toast.error(null, 'PERMISSIONS.DELETE_ERROR_ADMINISTRATORS');
        return;
    }
    const options: ModalDialogOptions = {
      title: 'PERMISSIONS.DELETE_TITLE',
      message: 'PERMISSIONS.DELETE_' + this._mode,
      messageParameters: {name: this._mode == 'USER' ? list[0].authorityName : list[0].profile.displayName},
      buttons: [
        new DialogButton('CANCEL', DialogButton.TYPE_CANCEL, () => this.closeDialog()),
        new DialogButton('PERMISSIONS.MENU_DELETE', DialogButton.TYPE_PRIMARY, () => callback(list))
      ],
      isCancelable: true,
    };
    if (list.length === 1) {
      options.message += '_SINGLE';
    }
    this.toast.showConfigurableDialog(options);
  }
  private refresh() {
    this.offset = 0;
    this.list = [];
    this.selected = [];
    this.listRef.refreshAvailableOptions();
    this.loadAuthorities();
  }

  private closeDialog() {
    this.toast.closeModalDialog();
  }

  private startDelete(data: any, position= 0, error= false) {
    this.closeDialog();
    if (position == data.length) {
      this.globalProgress = false;
      this.refresh();
      if (!error)
        this.toast.toast('PERMISSIONS.DELETED_' + this._mode);
      return;
    }
    this.globalProgress = true;
    if (this._mode == 'USER'){
        console.error('delete for user does not exists');
    }
    else{
      this.iam.deleteGroup(data[position].authorityName).subscribe(() => this.startDelete(data, position + 1, error), (error: any) => {
        this.toast.error(error);
        this.startDelete(data, position + 1, true);
    });
    }

  }
  private startExclude(data: any, position= 0) {
    this.closeDialog()
    if (position == data.length) {
      this.globalProgress = false;
      this.refresh();
      this.toast.toast('PERMISSIONS.DELETED_' + this._mode);
      return;
    }
    this.globalProgress = true;
    this.organization.removeMember(this.org.groupName, data[position].authorityName).subscribe(() => this.startExclude(data, position + 1), (error: any) => this.toast.error(error));
  }
  private createAuthority() {
    this.edit = {profile: {}};
    this.editDetails = {};
    this.editId = null;
    this.updateButtons();
  }
  private createGroup(){
      this.createAuthority();
      this.edit.profile.groupType = null;
      this.edit.profile.scopeType = null;
  }
  private createOrg() {
    this.createGroup();
  }

  private addMembersFunction(data: any) {
    if (data === 'ALL')
      this.addMembers = this.org;
    else {
      const list = this.getList(data);
      this.addMembers = list[0];
    }
    this.manageMemberSearch = '';
    this.searchMembers();
  }
  updateSelectedMembers(data: Authority[]) {
    this.selectedMembers = data;
    this.updateButtons();
  }
  private manageMembers(data: any) {
    if (data === 'ALL')
      this.editMembers = this.org;
    else {
      const list = this.getList(data);
      this.editMembers = list[0];
    }
    this.manageMemberSearch = '';
    this.searchMembers();
  }

  private deleteMember(list: any[], position= 0) {
    if (list.length === position){
      this.toast.toast('PERMISSIONS.MEMBER_REMOVED');
      this.selectedMembers = [];
      this.memberOptions.addOptions = this.getMemberOptions();
      this.memberList = [];
      this.memberListOffset = 0;
      this.searchMembers();
      this.globalProgress = false;
      return;
    }
    this.globalProgress = true;
    this.iam.deleteGroupMember(this.editMembers === 'ALL' ? this.org.authorityName : (this.editMembers as Group).authorityName, list[position].authorityName).subscribe(() => {
      this.deleteMember(list, position + 1);
    }, (error: any) => this.toast.error(error));
  }
    private deleteMembership(list: any[], position= 0) {
        if (list.length === position) {
            this.toast.toast('PERMISSIONS.MEMBERSHIP_REMOVED');
            this.selectedMembers = [];
            this.memberOptions.addOptions = this.getMemberOptions();
            this.memberList = [];
            this.memberListOffset = 0;
            this.searchMembers();
            this.globalProgress = false;
            return;
        }
        this.globalProgress = true;
        this.iam.deleteGroupMember(list[position].authorityName, this.editGroups.authorityName).subscribe(() => {
            this.deleteMembership(list,position + 1);
        }, (error: any) => this.toast.error(error));
    }
  searchMembers(){
    this.selectedMembers = [];
    this.memberOptions.addOptions = this.getMemberOptions();
    this.memberList = [];
    this.memberListOffset = 0;
    this.refreshMemberList();
  }
  refreshMemberList() {
    if (this.addMembers){
      if (this.org && this.addMembers.authorityName != this.org.authorityName){
        const request: any = {
          sortBy: ['authorityName'],
          offset: this.memberListOffset
        };
        this.memberListOffset += this.connector.numberPerRequest;
        this.iam.getGroupMembers(this.org.authorityName, this.manageMemberSearch, RestConstants.AUTHORITY_TYPE_USER, request).subscribe((data: IamAuthorities) => {
          this.memberList = this.memberList.concat(data.authorities);
          this.memberList = Helper.deepCopy(this.memberList);
        });
      }else {
        const request: any = {
          sortBy: ['firstName'],
          offset: this.memberListOffset
        };
        this.memberListOffset += this.connector.numberPerRequest;
        this.iam.searchUsers(this.manageMemberSearch, true, '', request).subscribe((data) => {
            this.memberList = this.memberList.concat(data.users);
            this.memberList = Helper.deepCopy(this.memberList);
        });
      }
    }
    else if (this.editGroups){
        const request: any = {
            sortBy: ['authorityName'],
            offset: this.memberListOffset
        };
        this.memberListOffset += this.connector.numberPerRequest;
        this.iam.getUserGroups(this.editGroups.authorityName, this.manageMemberSearch, request).subscribe((data) => {
            this.memberList = this.memberList.concat(data.groups);
            this.memberList = Helper.deepCopy(this.memberList);
        });
    }
    else {
      const request: any = {
        sortBy: ['authorityName'],
        offset: this.memberListOffset
      };
      this.memberListOffset += this.connector.numberPerRequest;
      this.iam.getGroupMembers((this.editMembers as Group).authorityName, this.manageMemberSearch, RestConstants.AUTHORITY_TYPE_USER, request).subscribe((data) => {
          this.memberList = this.memberList.concat(data.authorities);
          this.memberList = Helper.deepCopy(this.memberList);
      });
    }
    this.updateButtons();
  }

  private handleError(error: any) {
    if (error.status == RestConstants.DUPLICATE_NODE_RESPONSE)
        this.toast.error(null, 'PERMISSIONS.USER_EXISTS_IN_GROUP');
      else
        this.toast.error(error);
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (event.key == 'Escape') {
      if (this.addTo) {
        this.addTo = null;
        return;
      }
      if (this.edit){
        this.edit = null;
        return;
      }
      if (this.editMembers){
        this.cancelEditMembers();
        return;
      }
    }
  }

  private deleteOrg(list: any) {
    this.globalProgress = true;
    const org = list[0];
    this.organization.deleteOrganization(org.authorityName).subscribe(() => {
      this.toast.toast('PERMISSIONS.ORG_REMOVED');
      this.globalProgress = false;
      this.closeDialog();
      this.refresh();
    },
      (error: any) => {
      this.toast.error(error);
      this.globalProgress = false;
      this.refresh();
    });
  }
  deselectOrg(){
    this.onDeselectOrg.emit();
  }
  setOrgTab(){
    this.setTab.emit(0);
  }

  private downloadMembers() {
    const headers = this.columns.map((c) => this.translate.instant(this._mode + '.' + c.name));
    const data:string[][] = [];
    for (const entry of (this.list as UserSimple[])){
      data.push([
          entry.authorityName,
          entry.profile.firstName,
          entry.profile.lastName,
          entry.profile.email,
          entry.status.status
      ]);
    }
    CsvHelper.download(this.translate.instant('PERMISSIONS.DOWNLOAD_MEMBER_FILENAME'), headers, data);
  }
  openFolder(folder: SharedFolder) {
      UIHelper.goToWorkspaceFolder(this.node, this.router, this.connector.getCurrentLogin(), folder.id);
  }

    private updateButtons() {
        this.editButtons = [
            new DialogButton('CANCEL', DialogButton.TYPE_CANCEL, () => this.cancelEdit()),
            new DialogButton('SAVE', DialogButton.TYPE_PRIMARY, () => this.saveEdits())
        ];
        /**
         *
         <div class="card-action" *ngIf="editMembers">
         <a class="waves-effect waves-light btn" (click)="cancelEditMembers()">{{'CLOSE' | translate }}</a>
         </div>
         <div class="card-action" *ngIf="addMembers">
         <a class="waves-effect waves-light btn" [class.disabled]="selectedMembers.length==0" (click)="addMembersToGroup()">{{'ADD' | translate }}</a>
         <a class="waves-effect waves-light btn-flat" (click)="cancelEditMembers()">{{'CLOSE' | translate }}</a>
         </div>
         </div>
         */
        const add = new DialogButton('ADD', DialogButton.TYPE_PRIMARY, () => this.addMembersToGroup());
        add.disabled = this.selectedMembers.length === 0;
        this.memberButtons = [
            new DialogButton('CLOSE', DialogButton.TYPE_CANCEL, () => this.cancelEditMembers()),
        ];
        if (this.addMembers) {
            this.memberButtons.push(add);
        }
        this.editStatusButtons = [
        new DialogButton('CANCEL', DialogButton.TYPE_CANCEL, () => {this.editStatus = null; }),
        new DialogButton('SAVE', DialogButton.TYPE_PRIMARY, () => this.savePersonStatus())
        ];
        this.signupButtons = DialogButton.getSaveCancel(() => this.groupSignup = null, () => this.saveGroupSignup());
        this.signupListButtons = [new DialogButton('CLOSE', DialogButton.TYPE_CANCEL, () => this.groupSignupList = null)];
    }
  private setPersonStatus(data: UserSimple) {
    this.editStatus = data;
    this.updateButtons();
  }

  private savePersonStatus() {
    this.toast.showProgressDialog();
    this.iam.updateUserStatus(this.editStatus.authorityName, this.editStatus.status.status, this.editStatusNotify).subscribe(() => {
      this.toast.closeModalDialog();
      this.editStatus = null;
    }, (error) => {
      this.toast.closeModalDialog();
      this.toast.error(error);
    });
  }

  saveGroupSignup() {
    this.toast.showProgressDialog();
    if(this.groupSignupDetails.signupMethod === 'disabled') {
        this.groupSignupDetails.signupMethod = null;
    }
    this.iam.editGroupSignup(this.groupSignup.authorityName, this.groupSignupDetails).subscribe(() => {
      this.groupSignupDetails = null;
      this.refresh();
      this.toast.toast('PERMISSIONS.ORG_SIGNUP_SAVED');
      this.toast.closeModalDialog();
    }, error => {
      this.toast.error(error);
      this.toast.closeModalDialog();
    });
  }
}
