import { Component, EventEmitter, HostListener, Input, OnInit, Output } from '@angular/core';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { TranslateService } from '@ngx-translate/core';
import * as rxjs from 'rxjs';
import { BehaviorSubject, Subject, Observable } from 'rxjs';
import { map, skip, switchMap, takeUntil, tap, first } from 'rxjs/operators';
import {
    DialogButton,
    ListItem,
    Node,
    NodeList,
    RestCollectionService,
    RestConnectorService,
    RestConstants,
    RestNodeService,
} from '../../../core-module/core.module';
import { Toast } from '../../../core-ui-module/toast';
import { UIHelper } from '../../../core-ui-module/ui-helper';

@Component({
    selector: 'es-file-chooser',
    templateUrl: 'file-chooser.component.html',
    styleUrls: ['file-chooser.component.scss'],
})
/**
 * An edu-sharing file-picker modal dialog
 */
export class FileChooserComponent implements OnInit {
    /**
     * The caption of the dialog, will be translated automatically.
     */
    @Input() title: string;
    /**
     * The subtitle of the dialog. Will be auto-filled if left empty.
     */
    @Input() subtitle: string;
    /**
     * True if the dialog can be canceled by the user.
     */
    @Input() isCancelable: boolean;
    /**
     * An array of element id's which should be hidden in the list.
     */
    @Input() filterElements: string[] = [];
    /**
     * Set true if the user nees write permissions to the target file.
     */
    @Input() writeRequired = false;
    /**
     * Set true if the user should pick a collection, not a regular node.
     */
    @Input() set collections(collections: boolean) {
        this._collections = collections;
        this.viewType = 2;
        this.tabs = null;
        this.setHomeDirectory(RestConstants.ROOT, { canSelectHome: false });
        this.hasHeading = false;
        this._pickDirectory = false;
        this.icon = 'layers';
        this.searchMode = true;
        this.searchQuery = '';
        this.columns = UIHelper.getDefaultCollectionColumns();
        this.sortBy = RestConstants.CM_MODIFIED_DATE;
        this.sortAscending = false;
    }
    get collections() {
        return this._collections;
    }
    /**
     * Set to true if the user should pick a directory.
     */
    @Input() set pickDirectory(pickDirectory: boolean) {
        if (pickDirectory) {
            this.cardIcon = 'folder';
            this.filter.push(RestConstants.FILTER_FOLDERS);
        }
        this._pickDirectory = pickDirectory;
    }
    /**
     * Filter for individual file types, please see @RestNodeService.getChildren().
     */
    @Input() filter: string[] = [];
    @Input() priority = 0;

    /**
     * Fired when an element is choosen, a Node Array will be send as a result
     * If mode is set to directory or collection, the array will always contain 1 element
     */
    @Output() onChoose = new EventEmitter();
    /**
     * Fired when the picker was canceled by the user
     */
    @Output() onCancel = new EventEmitter();

    /**
     * Path to show as breadcrumbs, beginning with the first item after the current home directory.
     */
    readonly path$ = new BehaviorSubject<Node[]>([]);
    isLoading: boolean;
    columns: ListItem[] = [];
    sortBy: string;
    sortAscending = true;
    selectedFiles: Node[] = [];
    _collections = false;
    viewType = 0;
    searchMode: boolean;
    searchQuery: string;
    buttons: DialogButton[];
    defaultSubtitle: string;
    list: Node[] = [];
    icon: string = null;
    cardIcon: string;
    hasHeading = true;
    _pickDirectory: boolean;
    tabs = [
        {
            label: 'WORKSPACE.MY_FILES',
            homeIcon: 'person',
            directory: RestConstants.USERHOME,
            canSelectHome: true,
        },
        {
            label: 'WORKSPACE.SHARED_FILES',
            homeIcon: 'group',
            directory: RestConstants.SHARED_FILES,
            canSelectHome: false,
        },
    ];
    /** Replace home icon and -label given by tabs. */
    homeOverride: {
        label: string;
        icon: string;
    } = null;
    private hasMoreToLoad: boolean;
    private offset = 0;
    private homeDirectory: string;
    private currentDirectory: string;
    canSelectHome: boolean;
    private loadDirectoryTrigger = new Subject<{ directory: string; reset: boolean }>();

    constructor(
        private connector: RestConnectorService,
        private collectionApi: RestCollectionService,
        private nodeApi: RestNodeService,
        private toast: Toast,
        private translate: TranslateService,
    ) {
        // http://plnkr.co/edit/btpW3l0jr5beJVjohy1Q?p=preview
        this.columns.push(new ListItem('NODE', RestConstants.CM_NAME));
        this.sortBy = this.columns[0].name;
    }

    ngOnInit(): void {
        this.registerObservables();
        this.initialize();
    }

    @HostListener('document:keydown', ['$event'])
    handleKeyboardEvent(event: KeyboardEvent) {
        if (event.code === 'Escape' && this.isCancelable) {
            event.preventDefault();
            event.stopPropagation();
            this.cancel();
            return;
        }
    }
    folderIsWritable() {
        return this.path$?.value?.[this.path$?.value?.length - 1]?.access?.indexOf(RestConstants.ACCESS_WRITE) !== -1;
    }

    private registerObservables(): void {
        this.loadDirectoryTrigger
            .pipe(switchMap(({ directory, reset }) => this.loadDirectory(directory, reset)))
            .subscribe();
        this.path$.subscribe(() => this.updateButtons());
    }

    onTabChange(event: MatTabChangeEvent) {
        const tab = this.tabs[event.index];
        this.setHomeDirectory(tab.directory, { canSelectHome: tab.canSelectHome });
    }

    private setHomeDirectory(directory: string, { canSelectHome = false }): void {
        this.homeDirectory = directory;
        // FIXME: confusing naming: `canSelectHome` doesn't relate to `selectHome`.
        this.canSelectHome = canSelectHome;
        this.selectHome();
    }

    onSelection(node: Node[]) {
        this.selectedFiles = node;
    }

    private initialize() {
        if (this.homeDirectory) {
            this.viewDirectory(this.homeDirectory);
        } else {
            this.setHomeDirectory(this.tabs[0].directory, {
                canSelectHome: this.tabs[0].canSelectHome,
            });
        }
    }

    hasWritePermissions(node: any) {
        if (node.access.indexOf(RestConstants.ACCESS_WRITE) == -1) {
            return { status: false, message: 'NO_WRITE_PERMISSIONS' };
        }
        return { status: true };
    }

    selectBreadcrumb(position: number) {
        if (position === 0) {
            this.selectHome();
        } else {
            this.selectItem(this.path$.value[position - 1]);
        }
    }

    selectHome() {
        this.homeOverride = null;
        this.path$.next([]);
        this.viewDirectory(this.homeDirectory, true);
    }

    selectItem(event: Node) {
        if (event.isDirectory || this._collections) {
            if (this.searchMode) {
                this.selectedFiles = [event];
                return;
            }
            this.selectedFiles = [];
            if (this.path$.value?.[this.path$.value.length - 1]?.ref.id === event.parent.id) {
                // We selected the direct child of our previous node. Can update the path in place.
                this.path$.next([...this.path$.value, event]);
            } else if (this.path$.value?.some((ancestor) => ancestor.ref.id === event.ref.id)) {
                // We selected an ancestor of our previous node. Can update the path in place.
                const index = this.path$.value.findIndex(
                    (ancestor) => ancestor.ref.id === event.ref.id,
                );
                this.path$.next(this.path$.value.slice(0, index + 1));
            } else {
                // Couldn't update the path in place, load from backend.
                if (this.path$.value.length === 0) {
                    // We probably just selected a child of the home directory. Optimistically
                    // update accordingly, but fetch the actual data below anyway.
                    this.path$.next([event]);
                }
                this.updatePathFromBackend(event.ref.id)
                    // Abort when new directory is loaded before we could update the path.
                    .pipe(takeUntil(this.loadDirectoryTrigger.pipe(skip(1))))
                    .subscribe();
            }
            this.viewDirectory(event.ref.id);
        }
    }

    private updatePathFromBackend(id: string) {
        return this.nodeApi.getNodeParents(id).pipe(
            tap((data) => {
                this.path$.next(data.nodes.reverse());
                // When `scope` is not set, we didn't get the children of our home directory but
                // instead a path relative to root. This happens for the admin user.
                if (!data.scope) {
                    this.homeOverride = { label: null, icon: data.scope === 'SHARED_FILES' ? 'group' : 'person' }
                }
            }),
        );
    }

    onSelectionChanged(event: Node[]): void {
        // Triggered in collection mode.
        this.selectedFiles = event;
        this.updateButtons();
    }

    search() {
        this.viewDirectory(this.homeDirectory);
    }

    private viewDirectory(directory: string, reset = true) {
        this.loadDirectoryTrigger.next({ directory, reset });
    }

    private loadDirectory(directory: string, reset = true): Observable<void> {
        this.currentDirectory = directory;
        if (reset) {
            this.list = [];
            this.offset = 0;
            // this.hasMoreToLoad = true; // !this._collections; // Collections have no paging
        }
        this.isLoading = true;
        if (this._collections) {
            return this.collectionApi
                .search(this.searchQuery, {
                    offset: this.offset,
                    sortBy: [this.sortBy],
                    sortAscending: this.sortAscending,
                    propertyFilter: [RestConstants.ALL],
                })
                .pipe(
                    tap((data) => {
                        const result: any = [];
                        for (const c of data.collections) {
                            const obj: any = c;
                            // dummy for list-table so it recognizes a collection
                            obj.collection = c;
                            result.push(obj);
                        }
                        this.showList(result);
                    }),
                    map(() => {}),
                );
        } else {
            return this.nodeApi
                .getChildren(directory, this.filter, {
                    offset: this.offset,
                    sortBy: [this.sortBy],
                    sortAscending: this.sortAscending,
                    propertyFilter: [RestConstants.ALL],
                })
                .pipe(
                    tap((list: NodeList) => {
                        this.hasMoreToLoad =
                            list.pagination.count + list.pagination.from < list.pagination.total;
                        if (this.currentDirectory === this.homeDirectory && list.nodes.length > 0) {
                        }
                        this.showList(list.nodes);
                    }),
                    map(() => {}),
                );
        }
    }

    loadMore() {
        if (!this.hasMoreToLoad) {
            return;
        }
        this.offset += this.connector.numberPerRequest;
        this.viewDirectory(this.currentDirectory, false);
        this.isLoading = true;
    }

    setSorting(data: any) {
        this.sortBy = data.sortBy;
        this.sortAscending = data.sortAscending;
        this.list = null;
        this.viewDirectory(this.currentDirectory);
    }

    private showList(list: any) {
        this.addToList(list);
        this.updateButtons();
        this.isLoading = false;
    }

    cancel() {
        this.onCancel.emit();
    }

    private addToList(list: Node[]) {
        this.isLoading = false;
        if (!list.length) {
            this.hasMoreToLoad = false;
        }
        for (const node of list) {
            if (this.filterElements && this.filterElements.length) {
                if (this.filterElements.indexOf(node.ref.id) != -1) {
                    continue;
                }
            }
            this.list.push(node);
        }
    }

    private chooseDirectory() {
        (() => {
            if (this.path$.value.length) {
                return rxjs.of(this.path$.value[this.path$.value.length - 1]);
            } else {
                return this.nodeApi
                    .getNodeMetadata(this.homeDirectory)
                    .pipe(map((nodeWrapper) => nodeWrapper.node));
            }
        })().subscribe((node) => {
            if (this._collections) {
                if (node.access.indexOf(RestConstants.ACCESS_WRITE) === -1) {
                    this.toast.error(null, 'NO_WRITE_PERMISSIONS');
                    return;
                }
            }
            this.onChoose.emit([node]);
        });
    }

    private chooseFile() {
        if (this._collections) {
            if (this.selectedFiles[0].access.indexOf(RestConstants.ACCESS_WRITE) == -1) {
                this.toast.error(null, 'NO_WRITE_PERMISSIONS');
                return;
            }
        }
        this.onChoose.emit(this.selectedFiles);
    }

    updateButtons() {
        this.buttons = [
            new DialogButton(this.translate.instant('CANCEL'), DialogButton.TYPE_CANCEL, () =>
                this.cancel(),
            ),
        ];
        let confirmButton;
        if (this._pickDirectory) {
            if (this.path$.value.length) {
                this.defaultSubtitle = this.path$.value[this.path$.value.length - 1].name;
            } else {
                this.defaultSubtitle = this.translate.instant('SELECT_ROOT_NAME');
            }
            confirmButton = new DialogButton(
                this.translate.instant('APPLY'),
                DialogButton.TYPE_PRIMARY,
                () => this.chooseDirectory(),
            );
            confirmButton.disabled = (!this.path$.value.length && !this.canSelectHome) || !this.folderIsWritable();
        } else if (this.collections && !this.selectedFiles.length) {
            this.defaultSubtitle = null;
            confirmButton = new DialogButton(
                'SELECT_ROOT_DISABLED',
                DialogButton.TYPE_PRIMARY,
                () => {},
            );
            confirmButton.disabled = true;
        } else if (this.selectedFiles.length) {
            this.defaultSubtitle = this.selectedFiles[0].name;
            confirmButton = new DialogButton(
                this.translate.instant(this._collections ? 'SELECT_COLLECTION' : 'SELECT_FILE', {
                    name: this.defaultSubtitle,
                }),
                DialogButton.TYPE_PRIMARY,
                () => this.chooseFile(),
            );
            confirmButton.disabled =
                this.writeRequired &&
                this.hasWritePermissions(this.selectedFiles[0]).status == false;
        }
        if (confirmButton) {
            this.buttons.push(confirmButton);
        }
    }
}
