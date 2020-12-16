import {Component, NgZone, ViewChild, ViewEncapsulation} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {EventListener, FrameEventsService} from '../../../core-module/rest/services/frame-events.service';
import {MdsComponent} from '../mds/mds.component';
import {TranslateService} from '@ngx-translate/core';
import {ConfigurationService} from '../../../core-module/rest/services/configuration.service';
import {SessionStorageService} from '../../../core-module/rest/services/session-storage.service';
import {Translation} from '../../../core-ui-module/translation';
import {WorkspaceLicenseComponent} from '../../../modules/management-dialogs/license/license.component';
import {Toast} from "../../../core-ui-module/toast";
import {RestConstants} from "../../../core-module/rest/rest-constants";
import {MdsEditorWrapperComponent} from '../mds-editor/mds-editor-wrapper/mds-editor-wrapper.component';
import {UIHelper} from '../../../core-ui-module/ui-helper';
import {MainNavService} from '../../services/main-nav.service';

@Component({
    selector: 'mds-embed',
    encapsulation: ViewEncapsulation.None,
    template: `
        <app-mds-editor-wrapper #mdsRef [embedded]="true" editorMode="form" [currentValues]="data" [setId]="setId" [groupId]="groupId" *ngIf="component==='mds'"></app-mds-editor-wrapper>
        <workspace-license #licenseRef [properties]="data" [embedded]="true" *ngIf="component==='license'"></workspace-license>
    `,
    styleUrls: ['embed.component.scss']
})
export class EmbedComponent implements EventListener {
    @ViewChild('mdsRef') mdsRef : MdsEditorWrapperComponent;
    @ViewChild('licenseRef') licenseRef : WorkspaceLicenseComponent;
    component:string;
    data:any={};
    groupId = 'io';
    setId = RestConstants.DEFAULT;
    refresh:Boolean;
    constructor(private translate:TranslateService,
                private config:ConfigurationService,
                private storage:SessionStorageService,
                private mainNavService:MainNavService,
                private toast:Toast,
                private ngZone:NgZone,
                private route:ActivatedRoute,
                private event : FrameEventsService) {
        // disable the cookie info when in embedded context
        this.mainNavService.getCookieInfo().show = false;
        this.event.addListener(this);
        this.toast.showProgressDialog();
        Translation.initialize(this.translate,this.config,this.storage,this.route).subscribe(()=> {
            this.route.params.subscribe((params)=> {
               this.component=params.component;
                this.route.queryParams.subscribe((params) => {
                    if (params.group) {
                        this.groupId = params.group;
                    }
                    if (params.set) {
                        this.setId = params.set;
                    }
                    if (params.data) {
                        this.data = JSON.parse(params.data);
                    }
                    if(this.component === 'mds') {
                        UIHelper.waitForComponent(this.ngZone,this, 'mdsRef').subscribe(async () => {
                            await this.mdsRef.reInit();
                            this.toast.closeModalDialog();
                        });
                    } else {
                        this.toast.closeModalDialog();
                    }
                });
            });
        });
    }
    async onEvent(event: string, data: any) {
        if (event === FrameEventsService.EVENT_PARENT_FETCH_DATA) {
            if (this.component === 'mds') {
                this.event.broadcastEvent(FrameEventsService.EVENT_POST_DATA, await this.mdsRef.getValues());
            } else if (this.component === 'license') {
                this.event.broadcastEvent(FrameEventsService.EVENT_POST_DATA, this.licenseRef.getProperties());
            }
        }
    }
}
