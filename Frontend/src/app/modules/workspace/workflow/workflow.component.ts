import { trigger } from '@angular/animations';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { forkJoin, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
    ConfigurationService,
    DialogButton,
    Node,
    Permission,
    RestConnectorService,
    RestConstants,
    RestHelper,
    RestNodeService,
    UserSimple,
    WorkflowDefinition,
    WorkflowEntry,
} from '../../../core-module/core.module';
import { UIAnimation } from '../../../core-module/ui/ui-animation';
import { NodeHelper } from '../../../core-ui-module/node-helper';
import { AuthorityNamePipe } from '../../../core-ui-module/pipes/authority-name.pipe';
import { Toast } from '../../../core-ui-module/toast';

@Component({
    selector: 'workspace-workflow',
    templateUrl: 'workflow.component.html',
    styleUrls: ['workflow.component.scss'],
    animations: [
        trigger('fade', UIAnimation.fade()),
        trigger('cardAnimation', UIAnimation.cardAnimation()),
    ],
})
export class WorkspaceWorkflowComponent implements OnChanges {
    dialogTitle: string;
    dialogMessage: string;
    dialogMessageParameters: any;
    dialogButtons: DialogButton[];
    loading = true;
    receivers: UserSimple[] = [];
    status = RestConstants.WORKFLOW_STATUS_UNCHECKED;
    initialStatus = RestConstants.WORKFLOW_STATUS_UNCHECKED;
    chooseStatus = false;
    comment: string;
    validStatus: WorkflowDefinition[];
    history: WorkflowEntry[];
    globalAllowed: boolean;
    globalSearch = false;
    readonly TYPE_EDITORIAL = RestConstants.GROUP_TYPE_EDITORIAL;
    buttons: DialogButton[];

    @Input() nodes: Node[];

    @Output() onDone = new EventEmitter<Node[]>();
    @Output() onClose = new EventEmitter();
    @Output() onLoading = new EventEmitter();

    constructor(
        private nodeService: RestNodeService,
        private translate: TranslateService,
        private config: ConfigurationService,
        private connector: RestConnectorService,
        private toast: Toast,
    ) {
        this.updateButtons();
        this.connector
            .hasToolPermission(RestConstants.TOOLPERMISSION_GLOBAL_AUTHORITY_SEARCH)
            .subscribe((has: boolean) => (this.globalAllowed = has));
        this.config.getAll().subscribe(() => {
            this.validStatus = NodeHelper.getWorkflows(this.config);
        });
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.nodes) {
            this.initNodes(changes.nodes.currentValue);
        }
    }

    isAllowedAsNext(status: WorkflowDefinition) {
        if (!this.initialStatus.next) {
            return true;
        }
        if (this.initialStatus.id === status.id) {
            return true;
        }
        return this.initialStatus.next.indexOf(status.id) !== -1;
    }

    setStatus(status: WorkflowDefinition) {
        if (!this.isAllowedAsNext(status)) {
            return;
        }
        this.status = status;
        this.chooseStatus = false;
        this.updateButtons();
    }

    addSuggestion(data: UserSimple) {
        this.receivers = [data];
        this.updateButtons();
    }

    getWorkflowForId(id: string) {
        return NodeHelper.getWorkflowStatusById(this.config, id);
    }

    removeReceiver(data: UserSimple) {
        const pos = this.receivers.indexOf(data);
        if (pos !== -1) {
            this.receivers.splice(pos, 1);
        }
        this.updateButtons();
    }

    hasChanges() {
        return this.statusChanged() || this.receiversChanged();
    }

    async saveWorkflow() {
        if (!this.comment && this.receiversChanged()) {
            this.toast.error(null, 'WORKSPACE.WORKFLOW.NO_COMMENT');
            return;
        }
        const receivers = this.status.hasReceiver ? this.receivers : [];
        if (receivers.length) {
            const hasPermission = await this.requestReceiverPermissionIfNeeded(this.receivers[0]);
            if (!hasPermission) {
                return;
            }
        }
        this.saveWorkflowFinal(receivers);
    }

    cancel() {
        this.onClose.emit();
    }

    private async initNodes(nodes: Node[]): Promise<void> {
        if (!nodes || nodes.length === 0) {
            return;
        }
        this.loading = true;
        try {
            await this.initNodesInner(nodes);
        } catch (error) {
            this.toast.error(error);
            this.cancel();
        } finally {
            this.loading = false;
        }
    }

    private async initNodesInner(nodes: Node[]): Promise<void> {
        this.nodes = await this.fetchCompleteNodes(nodes).toPromise();
        const histories = await forkJoin(
            nodes.map((node) => this.nodeService.getWorkflowHistory(node.ref.id)),
        ).toPromise();
        if (nodes.length > 1) {
            if (histories.some((history) => history.length > 0)) {
                this.toast.error(null, 'WORKSPACE.WORKFLOW.BULK_WORKFLOWS_EXIST');
                this.cancel();
                return;
            } else {
                this.history = [];
                this.receivers = [];
                this.status = NodeHelper.getWorkflows(this.config)[0];
            }
        } else {
            this.history = histories[0];
            if (this.history.length) {
                this.receivers = this.history[0].receiver;
            }
            if (!this.receivers || (this.receivers.length === 1 && !this.receivers[0])) {
                this.receivers = [];
            }
            this.status = NodeHelper.getWorkflowStatus(this.config, nodes[0]);
        }
        this.initialStatus = this.status;
    }

    private fetchCompleteNodes(nodes: Node[]): Observable<Node[]> {
        return forkJoin(
            nodes.map((node) =>
                this.nodeService
                    .getNodeMetadata(node.ref.id, [RestConstants.ALL])
                    .pipe(map((nodeWrapper) => nodeWrapper.node)),
            ),
        );
    }

    private saveWorkflowFinal(receivers: UserSimple[]) {
        const entry = new WorkflowEntry();
        const receiversClean: any[] = [];
        for (const r of receivers) {
            receiversClean.push({ authorityName: r.authorityName });
        }
        entry.receiver = receiversClean;
        entry.comment = this.comment;
        entry.status = this.status.id;
        this.onLoading.emit(true);
        forkJoin(
            this.nodes.map((node) => this.nodeService.addWorkflow(node.ref.id, entry)),
        ).subscribe(
            () => {
                this.toast.toast('WORKSPACE.TOAST.WORKFLOW_UPDATED');
                this.fetchCompleteNodes(this.nodes).subscribe(
                    (nodes) => {
                        this.onDone.emit(nodes);
                        this.onLoading.emit(false);
                    },
                    (error) => {
                        this.toast.error(error);
                        this.onLoading.emit(false);
                    },
                );
            },
            (error) => {
                this.toast.error(error);
                this.onLoading.emit(false);
            },
        );
    }

    private receiversChanged() {
        if (this.nodes.length > 1) {
            return this.receivers.length !== 0;
        } else {
            const prop: string[] = this.nodes[0].properties[RestConstants.CCM_PROP_WF_RECEIVER];
            if (prop) {
                if (prop.length !== this.receivers.length) {
                    return true;
                }
                for (const receiver of this.receivers) {
                    if (prop.indexOf(receiver.authorityName) === -1) {
                        return true;
                    }
                }
                return false;
            }
            return this.receivers.length > 0;
        }
    }

    private statusChanged() {
        return this.status !== this.initialStatus;
    }

    private updateButtons() {
        const save = new DialogButton('SAVE', DialogButton.TYPE_PRIMARY, () => this.saveWorkflow());
        save.disabled = this.loading || !this.hasChanges();
        this.buttons = [
            new DialogButton('CANCEL', DialogButton.TYPE_CANCEL, () => this.cancel()),
            save,
        ];
    }

    /**
     * Checks if the given receiver has the 'coordinator' permission and requests to grant it to
     * them if not.
     *
     * @returns `true` if the receiver had or was granted the permission
     */
    private async requestReceiverPermissionIfNeeded(receiver: UserSimple): Promise<boolean> {
        const permissionsList = await forkJoin(
            this.nodes.map((node) =>
                this.nodeService.getNodePermissionsForUser(node.ref.id, receiver.authorityName),
            ),
        ).toPromise();
        const nodesMissingPermission = this.nodes.filter(
            (_, index) => !permissionsList[index].includes(RestConstants.PERMISSION_COORDINATOR),
        );
        if (nodesMissingPermission.length === 0) {
            return true;
        } else {
            const shouldGrantPermission = await this.requestReceiverPermissionDialog(receiver);
            if (shouldGrantPermission) {
                await this.grantReceiverPermission(nodesMissingPermission, receiver);
            }
            return shouldGrantPermission;
        }
    }

    /**
     * Shows a dialog to the user, asking them whether to grant missing permissions to the receiver.
     *
     * @returns `true` if the user decided to grant the permissions.
     */
    private async requestReceiverPermissionDialog(receiver: UserSimple): Promise<boolean> {
        return new Promise((resolve) => {
            this.dialogTitle = 'WORKSPACE.WORKFLOW.USER_NO_PERMISSION';
            this.dialogMessage = 'WORKSPACE.WORKFLOW.USER_NO_PERMISSION_INFO';
            this.dialogMessageParameters = {
                user: new AuthorityNamePipe(this.translate).transform(receiver, null),
            };
            this.dialogButtons = [
                new DialogButton('CANCEL', DialogButton.TYPE_CANCEL, () => {
                    this.dialogTitle = null;
                    resolve(false);
                }),
                new DialogButton('WORKSPACE.WORKFLOW.PROCEED', DialogButton.TYPE_PRIMARY, () => {
                    this.dialogTitle = null;
                    resolve(true);
                }),
            ];
        });
    }

    private async grantReceiverPermission(nodes: Node[], receiver: UserSimple): Promise<void> {
        this.loading = true;
        try {
            await Promise.all(
                nodes.map((node) => this.addWritePermission(receiver.authorityName, node)),
            );
        } catch (error) {
            this.toast.error(error);
        }
    }

    private async addWritePermission(authority: string, node: Node): Promise<void> {
        const nodePermissions = await this.nodeService.getNodePermissions(node.ref.id).toPromise();
        const permission = new Permission();
        permission.authority = {
            authorityName: authority,
            authorityType: RestConstants.AUTHORITY_TYPE_USER,
        };
        permission.permissions = [RestConstants.PERMISSION_COORDINATOR];
        nodePermissions.permissions.localPermissions.permissions.push(permission);
        const permissions = RestHelper.copyAndCleanPermissions(
            nodePermissions.permissions.localPermissions.permissions,
            nodePermissions.permissions.localPermissions.inherited,
        );
        await this.nodeService.setNodePermissions(node.ref.id, permissions, false).toPromise();
    }
}
