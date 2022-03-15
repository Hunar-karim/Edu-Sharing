import {trigger} from '@angular/animations';
import {HttpClient} from '@angular/common/http';
import {
    AfterViewInit,
    Component,
    ElementRef,
    HostListener,
    OnDestroy,
    OnInit,
    ViewChild
} from '@angular/core';
import {ActivatedRoute, Params, Router} from '@angular/router';
import {TranslateService} from '@ngx-translate/core';
import {ActionbarHelperService} from '../../common/services/actionbar-helper';
import {GlobalContainerComponent} from '../../common/ui/global-container/global-container.component';
import {MainNavComponent} from '../../common/ui/main-nav/main-nav.component';
import {MdsEditorWrapperComponent} from '../../common/ui/mds-editor/mds-editor-wrapper/mds-editor-wrapper.component';
import {BridgeService} from '../../core-bridge-module/bridge.service';
import {
    CollectionWrapper,
    ConfigurationHelper,
    ConfigurationService,
    DialogButton,
    Facette,
    ListItem, ListItemSort,
    LoginResult,
    MdsInfo,
    MdsMetadatasets,
    NetworkRepositories,
    Node,
    NodeList,
    NodeWrapper,
    Repository,
    RestCollectionService,
    RestConnectorService,
    RestConstants,
    RestHelper,
    RestIamService,
    RestNetworkService,
    RestNodeService,
    RestSearchService,
    SearchList,
    SearchRequestCriteria,
    SessionStorageService,
    TemporaryStorageService,
    UIService
} from '../../core-module/core.module';
import {Helper} from '../../core-module/rest/helper';
import {MdsHelper} from '../../core-module/rest/mds-helper';
import {UIAnimation} from '../../core-module/ui/ui-animation';
import {OPEN_URL_MODE, UIConstants} from '../../core-module/ui/ui-constants';
import {ListTableComponent} from '../../core-ui-module/components/list-table/list-table.component';
import {
    CustomOptions,
    DefaultGroups,
    ElementType,
    OptionItem,
    Scope
} from '../../core-ui-module/option-item';
import {Toast} from '../../core-ui-module/toast';
import {Translation} from '../../core-ui-module/translation';
import {UIHelper} from '../../core-ui-module/ui-helper';
import {SearchService} from './search.service';
import {WindowRefService} from './window-ref.service';
import {MdsDefinition, Values} from '../../common/ui/mds-editor/types';
import {NodeHelperService} from '../../core-ui-module/node-helper.service';
import {FormControl} from '@angular/forms';
import {BehaviorSubject, ReplaySubject, combineLatest, Observable} from 'rxjs';
import {delay, distinctUntilChanged, first, map, shareReplay, switchMap, takeUntil, tap} from 'rxjs/operators';
import {MatTabGroup} from '@angular/material/tabs';
import {OptionsHelperService} from '../../core-ui-module/options-helper.service';
import {
    NodeEntriesWrapperComponent
} from '../../core-ui-module/components/node-entries-wrapper/node-entries-wrapper.component';
import {NodeDataSource} from '../../core-ui-module/components/node-entries-wrapper/node-data-source';
import {ActionbarComponent} from '../../common/ui/actionbar/actionbar.component';
import { SearchFieldService } from 'src/app/common/ui/search-field/search-field.service';
import { MdsService, MetadataSetInfo, SearchResults, SearchService as SearchApiService } from 'ngx-edu-sharing-api';
import * as rxjs from 'rxjs';
import {InteractionType, ListSortConfig, NodeEntriesDisplayType} from '../../core-ui-module/components/node-entries-wrapper/entries-model';

@Component({
    selector: 'es-search',
    templateUrl: 'search.component.html',
    styleUrls: ['search.component.scss'],
    providers: [WindowRefService],
    animations: [trigger('fromLeft', UIAnimation.fromLeft())],
})
export class SearchComponent implements AfterViewInit, OnDestroy {
    readonly SCOPES = Scope;
    readonly NodeEntriesDisplayType = NodeEntriesDisplayType;
    readonly InteractionType = InteractionType;

    @ViewChild('mdsMobile') mdsMobileRef: MdsEditorWrapperComponent;
    @ViewChild('mdsDesktop') mdsDesktopRef: MdsEditorWrapperComponent;
    @ViewChild('list') list: ListTableComponent;
    @ViewChild('mainNav') mainNavRef: MainNavComponent;
    @ViewChild('extendedSearch') extendedSearch: ElementRef;
    @ViewChild('toolbar') toolbar: any;
    @ViewChild('extendedSearchTabGroup') extendedSearchTabGroup: MatTabGroup;
    @ViewChild('sidenav') sidenavRef: ElementRef<HTMLElement>;
    @ViewChild('collections') collectionsRef: ElementRef;
    @ViewChild('actionbarComponent') actionbarComponent: ActionbarComponent;
    @ViewChild('nodeEntriesResults') nodeEntriesResults: NodeEntriesWrapperComponent<Node>;
    toolPermissions: string[];
    innerWidth: number = 0;
    breakpoint: number = 800;
    initalized: boolean;
    tutorialElement: ElementRef;
    mdsExtended = false;
    private collectionsMoreSubject = new BehaviorSubject(false);
    set collectionsMore(value: boolean) {
        this.collectionsMoreSubject.next(value);
    }
    get collectionsMore(): boolean {
        return this.collectionsMoreSubject.value;
    }
    nodeReport: Node;
    nodeVariant: Node;
    currentRepository: string = RestConstants.HOME_REPOSITORY;
    currentRepositoryObject: Repository;
    applyMode = false;
    hasCheckbox = false;
    showMoreRepositories = false;
    savedSearchOptions: CustomOptions = {
        useDefaultOptions: false
    };
    isGuest = false;
    mainnav = true;
    queryId = RestConstants.DEFAULT_QUERY_NAME;
    groupResults = false;
    actionOptions: OptionItem[] = [];
    allRepositories: Repository[];
    repositories: Repository[];
    globalProgress = false;
    addNodesToCollection: Node[];
    addNodesStream: Node[];
    oldParams: Params;
    get mdsId() {
        return this._mdsId;
    }
    set mdsId(mdsId: string) {
        this._mdsId = mdsId;
        this.searchService.setMetadataSet(mdsId);
    }
    extendedRepositorySelected = false;
    savedSearch: Node[] = [];
    savedSearchColumns: ListItem[] = [];
    saveSearchDialog = false;
    savedSearchLoading = false;
    savedSearchQuery: string = null;
    savedSearchQueryModel: string = null;
    addToCollection: Node;
    extendedSearchSelectedTab = new FormControl(0);

    private renderedNode: Node;
    private viewToggle: OptionItem;
    // Max items to fetch at all (afterwards no more infinite scroll)
    private static MAX_ITEMS_COUNT = 2000;
    repositoryIds: any[] = [];
    mdsSets: MdsInfo[];
    _mdsId: string;
    private isSearching = false;
    isSearchingCollections = false;
    groupedRepositories: Repository[];
    private enabledRepositories: string[];
    // we only initalize the banner once to prevent flickering
    private bannerInitalized = false;
    currentValues: Values;
    private currentMdsSet: MdsDefinition;
    mdsActions: OptionItem[];
    mdsButtons: DialogButton[];
    currentSavedSearch: Node;
    private login: LoginResult;
    savedSearchOwn = true;
    private nodeDisplayed: Node;
    customOptions: CustomOptions = {
        useDefaultOptions: true
    };
    private destroyed$ = new ReplaySubject<void>(1);
    collectionsContainerWidthSubject = new BehaviorSubject(0);
    private collectionsPerRowSubject = new BehaviorSubject(0);
    visibleCollectionsSubject = new BehaviorSubject<Node[]>(null);
    hasMoreCollectionsSubject = new BehaviorSubject(false);
    areAllCollectionsDisplayed$ = this.searchService.dataSourceCollections
        .areAllDisplayed()
        // Prevent changed-after-checked error
        .pipe(delay(0));
    readonly didYouMeanSuggestion$ = this.searchApi
        .getDidYouMeanSuggestion()
        .pipe(shareReplay(1));

    constructor(
        private router: Router,
        private http: HttpClient,
        private connector: RestConnectorService,
        private RestNodeService: RestNodeService,
        private mds: MdsService,
        private bridge: BridgeService,
        private iam: RestIamService,
        private search: RestSearchService,
        private collectionApi: RestCollectionService,
        private actionbar: ActionbarHelperService,
        private nodeApi: RestNodeService,
        private toast: Toast,
        private translate: TranslateService,
        private activatedRoute: ActivatedRoute,
        private winRef: WindowRefService,
        public searchService: SearchService,
        private nodeHelper: NodeHelperService,
        private config: ConfigurationService,
        private uiService: UIService,
        private optionsHelper: OptionsHelperService,
        private storage: SessionStorageService,
        private network: RestNetworkService,
        private temporaryStorageService: TemporaryStorageService,
        private searchField: SearchFieldService,
        private searchApi: SearchApiService,
    ) {
        // Subscribe early to make sure the suggestions are requested with search requests.
        this.didYouMeanSuggestion$.pipe(takeUntil(this.destroyed$)).subscribe();
    }

    ngAfterViewInit() {
        setTimeout(() => {
            this.tutorialElement = this.mainNavRef.searchField.input;
            this.handleScroll();
        });
        this.searchService.clear();
        this.initalized = true;
        this.searchService.clear();
        if (this.searchService.reinit) {
            this.searchService.init();
            this.initalized = false;
            this.searchService.dataSourceSearchResult[0].isLoading = true;
        }
        this.savedSearchColumns.push(
            new ListItem('NODE', RestConstants.LOM_PROP_TITLE),
        );
        this.optionsHelper.setListener({
           onDisplayTypeChange: (type) => this.setDisplayType(type)
        });
        this.connector.setRoute(this.activatedRoute).subscribe(() => {
            Translation.initialize(
                this.translate,
                this.config,
                this.storage,
                this.activatedRoute,
            ).subscribe(() => {
                if (this.setSidenavSettings()) {
                    // auto, never, always
                    let sidenavMode = this.config.instant(
                        'searchSidenavMode',
                        'never',
                    );
                    if (sidenavMode === 'never') {
                        this.searchService.sidenavOpened = false;
                    }
                    if (sidenavMode === 'always') {
                        this.searchService.sidenavOpened = true;
                    }
                }
                this.printListener();
                if (this.searchService.displayType == null) {
                    this.setDisplayType(
                        this.config.instant(
                            'searchViewType',
                            this.config.instant('searchViewType', NodeEntriesDisplayType.Grid),
                        ),
                    );
                }
                this.groupResults = this.config.instant(
                    'searchGroupResults',
                    false,
                );

                this.connector
                    .hasToolPermission(
                        RestConstants.TOOLPERMISSION_UNCHECKEDCONTENT,
                    )
                    .subscribe(unchecked => {
                        this.network.getRepositories().subscribe(
                            (data: NetworkRepositories) => {
                                this.allRepositories = Helper.deepCopy(
                                    data.repositories,
                                );
                                this.repositories = ConfigurationHelper.filterValidRepositories(
                                    data.repositories,
                                    this.config,
                                    !unchecked,
                                );
                                if (this.repositories.length < 1) {
                                    console.warn(
                                        'After filtering repositories via config, none left. Will use the home repository as default',
                                    );
                                    this.repositories = this.getHomeRepoList();
                                }
                                if (this.repositories.length < 2) {
                                    this.repositoryIds = [
                                        this.repositories.length
                                            ? this.repositories[0].id
                                            : RestConstants.HOME_REPOSITORY,
                                    ];
                                    /*this.repositories = null;*/
                                }
                                this.updateCurrentRepositoryId();
                                if (this.repositories && !this.repositories.some((r) => r.repositoryType === 'ALL')) {
                                    const all = new Repository();
                                    all.id = RestConstants.ALL;
                                    all.title = this.translate.instant(
                                        'SEARCH.REPOSITORY_ALL',
                                    );
                                    all.repositoryType = 'ALL';
                                    this.repositories.splice(0, 0, all);
                                    this.updateRepositoryOrder();
                                }
                                this.initParams();
                            },
                            (error: any) => {
                                console.warn(
                                    'could not fetch repository list. Remote repositories can not be shown. Some features might not work properly. Please check the error and re-configure the repository',
                                );
                                this.repositories = this.getHomeRepoList();
                                this.allRepositories = [];
                                let home: any = {
                                    id: 'local',
                                    isHomeRepo: true,
                                };
                                this.allRepositories.push(home);
                                this.repositoryIds = [];
                                this.initParams();
                            },
                        );
                    });
            });
        });
        this.searchService.sidenavOpened$
            .pipe(takeUntil(this.destroyed$))
            .subscribe(() => this.extendedSearchTabGroup?.realignInkBar());

        this.scrollTo(this.searchService.offset);
        this.innerWidth = this.winRef.getNativeWindow().innerWidth;
        //this.autocompletesArray = this.autocompletes.toArray();
        this.registerSearchOnMdsUpdate();
        this.registerOnSelectionChange();
    }

    ngOnDestroy() {
        this.temporaryStorageService.set(TemporaryStorageService.NODE_RENDER_PARAMETER_DATA_SOURCE, this.searchService.dataSourceSearchResult[0]);
        this.destroyed$.next();
        this.destroyed$.complete();
    }

    @HostListener('window:scroll', ['$event'])
    @HostListener('window:touchmove', ['$event'])
    @HostListener('window:resize', ['$event'])
    handleScroll(event: Event = null) {
        // calculate height of filter part individually
        // required since banners, footer etc. can cause wrong heights and overflows
        this.searchService.offset =
            window.pageYOffset || document.documentElement.scrollTop;
        if (this.sidenavRef?.nativeElement.style.top) {
            const sideNavHeight =
                window.innerHeight - parseFloat(this.sidenavRef.nativeElement.style.top);
            this.sidenavRef.nativeElement.style.height = sideNavHeight + 'px';
        }
    }

    setRepository(repository: string) {
        this.routeSearch(null, repository, null, {});
    }

    acceptDidYouMeanSuggestion(text: string): void {
        this.searchService.searchTerm = text;
        this.applyParameters('did-you-mean-suggestion')
    }

    async applyParameters(
        origin: 'mainnav' | 'mds' | 'did-you-mean-suggestion' | 'sort',
        props: Values = null,
    ) {
        this.searchService.reinit = true;
        this.searchService.extendedSearchUsed = true;
        if(origin === 'mds') {
            this.currentValues = props;
        }
        this.updateGroupedRepositories();
        if (
            UIHelper.evaluateMediaQuery(
                UIConstants.MEDIA_QUERY_MAX_WIDTH,
                UIConstants.MOBILE_WIDTH,
            )
        ) {
            this.searchService.sidenavOpened = false;
        }
        await this.routeSearchParameters(props);
        this.getSearch(
            this.searchService.searchTerm,
            true);
    }

    downloadNode() {
        window.open(this.renderedNode.downloadUrl);
    }

    updateSelection(selection: Node[]) {
        this.nodeEntriesResults.getSelection().clear();
        this.nodeEntriesResults.getSelection().select(...selection);
        this.onSelectionChanged();
    }

    private onSelectionChanged(): void {
        this.setFixMobileNav();
    }

    private registerOnSelectionChange(): void {
        this.nodeEntriesResults.getSelection().changed.pipe(
            takeUntil(this.destroyed$),
        ).subscribe(() => this.onSelectionChanged());
    }

    getHomeRepoList() {
        return [{ id: 'local', isHomeRepo: true } as any];
    }

    refresh() {
        this.getSearch(null, true);
    }

    scrollTo(y = 0) {
        this.winRef.getNativeWindow().scrollTo(0, y);
        // fix: prevent upscrolling in prod mode
        setTimeout(() => this.winRef.getNativeWindow().scrollTo(0, y));
    }

    handleFocus(event: Event) {
        if (this.innerWidth < this.breakpoint) {
            this.scrollTo();
        }
    }

    isMobileHeight() {
        return window.innerHeight < UIConstants.MOBILE_HEIGHT + UIConstants.MOBILE_STAGE * 2;
    }

    isMobileWidth() {
        return window.innerWidth < UIConstants.MOBILE_WIDTH;
    }

    isMdsLoading() {
        return !this.mdsDesktopRef || this.mdsDesktopRef.isLoading;
    }

    canDrop() {
        return false;
    }

    getMoreResults() {
        if (this.searchService.complete == false) {
            //this.searchService.skipcount = this.searchService.searchResult.length;
            this.getSearch();
        }
    }

    onResize() {
        this.innerWidth = this.winRef.getNativeWindow().innerWidth;
        this.setSidenavSettings();
    }

    setSidenavSettings() {
        if (this.addToCollection) {
            this.searchService.sidenavOpened = false;
            return false;
        }
        if (this.searchService.sidenavSet) return false;
        this.searchService.sidenavSet = true;
        if (this.innerWidth < this.breakpoint) {
            this.searchService.sidenavOpened = false;
        } else {
            this.searchService.sidenavOpened = true;
        }
        return true;
    }

    routeSearchParameters(parameters: { [property: string]: string[] }) {
        this.routeSearch(
            this.searchService.searchTerm,
            this.currentRepository,
            this.mdsId,
            parameters,
        );
    }

    async getMdsValues(): Promise<{ [property: string]: string[] }> {
        if (this.currentRepository === RestConstants.ALL) {
            return {};
        }
        if (this.mdsMobileRef) {
            return this.mdsMobileRef.getValues()
        } else {
            return this.mdsDesktopRef.getValues();
        }
    }

    routeAndClearSearch(query: any) {
        if (!query.cleared) {
            this.uiService.hideKeyboardIfMobile();
        }
        this.routeSearch(
            query.query,
            this.currentRepository,
            this.mdsId,
        );
    }

    async routeSearch(
        query = this.searchService.searchTerm,
        repository = this.currentRepository,
        mds = this.mdsId,
        parameters?: { [property: string]: string[] },
    ) {
        if (!parameters) {
            parameters = await this.getMdsValues();
        }
        this.scrollTo();
        UIHelper.getCommonParameters(this.activatedRoute).subscribe(async (queryParams) => {
            queryParams.addToCollection = this.addToCollection
                ? this.addToCollection.ref.id
                : null;
            queryParams.query = query;
            queryParams.parameters = parameters && Object.keys(parameters)
                ? JSON.stringify(parameters)
                : null;
            queryParams.repositoryFilter = this.getEnabledRepositories().join(',');
            queryParams.mds = mds;
            queryParams.repository = repository;
            queryParams.mdsExtended = this.mdsExtended;
            queryParams.sidenav = this.searchService.sidenavOpened;
            queryParams.materialsSortBy = this.searchService.sort.active;
            queryParams.materialsSortAscending = this.searchService.sort.direction === 'asc';
            const result = await this.router.navigate([UIConstants.ROUTER_PREFIX + 'search'],
                {queryParams}
            );
            if (result !== true) {
                // this.invalidateMds();
                // this.searchService.init();
            }
        });
    }

    getSearch(
        searchString: string = null,
        init = false,
    ) {
        if ((this.isSearching && init) || this.repositoryIds.length == 0) {
            /*setTimeout(
                () => this.getSearch(searchString, init),
                100,
            );*/
            return;
        }
        if (this.isSearching && !init) {
            return;
        }
        this.isSearching = true;
        this.searchService.dataSourceSearchResult[0].isLoading = true;
        if (searchString == null) searchString = this.searchService.searchTerm;
        if (searchString == null) searchString = '';
        this.searchService.searchTerm = searchString;
        if (init) {
            this.searchService.init();
        } else if (
            this.searchService.dataSourceSearchResult[0]?.getData()?.length >
            SearchComponent.MAX_ITEMS_COUNT
        ) {
            this.searchService.dataSourceSearchResult[0].isLoading = false;
            this.searchService.complete = true;
            this.isSearching = false;
            return;
        }

        const criterias = this.getCriterias(this.currentValues, searchString);

        const repos =
            this.currentRepository == RestConstants.ALL
                ? this.repositoryIds
                : [{ id: this.currentRepository, enabled: true }];
        this.searchField.setFilterValues(this.currentValues);
        this.searchRepository(repos, criterias, init);

        if (init) {
            this.searchService.dataSourceCollections.reset();
            if (
                this.isHomeRepository() ||
                this.currentRepository == RestConstants.ALL
            ) {
                this.isSearchingCollections = true;
                this.search
                    .searchWithBody(
                      {criteria: this.getCriterias(this.currentValues, searchString, false), facets: []},
                        {sortBy: [
                                RestConstants.CCM_PROP_COLLECTION_PINNED_STATUS,
                                RestConstants.CCM_PROP_COLLECTION_PINNED_ORDER,
                                RestConstants.CM_MODIFIED_DATE,
                            ],
                            propertyFilter: [RestConstants.ALL],
                            sortAscending: [false, true, false],
                        },
                        // this is now handled via mds queries
                        RestConstants.CONTENT_TYPE_ALL,
                        this.currentRepository == RestConstants.ALL
                            ? RestConstants.HOME_REPOSITORY
                            : this.currentRepository,
                        this.mdsId,
                        [],
                        RestConstants.QUERY_NAME_COLLECTIONS,
                    )
                    .subscribe(
                        (data: NodeList) => {
                            this.isSearchingCollections = false;
                            this.searchService.dataSourceCollections.setData(data.nodes, data.pagination);
                            this.searchService.dataSourceCollections.setCanLoadMore(false);
                        },
                        (error: any) => {
                            this.isSearchingCollections = false;
                            this.toast.error(error);
                        },
                    );
            }
        }
    }

    updateGroupedRepositories() {
        let list = this.repositories.slice(1);
        for (let repo of this.repositoryIds) {
            if (repo.enabled) continue;
            let repoFound = RestNetworkService.getRepositoryById(repo.id, list);
            if (repoFound) list.splice(list.indexOf(repoFound), 1);
        }
        this.groupedRepositories = list;
    }
    render(event: any) {
        const node: Node = event.node;
        if (node.collection) {
            this.switchToCollections(node.ref.id);
            return;
        }

        const useRender=RestNetworkService.isHomeRepo(node.ref.repo, this.allRepositories) ||
                    RestNetworkService.getRepositoryById(node.ref.repo,this.allRepositories).renderingSupported;
        if(!useRender) {
          UIHelper.openUrl(node.content.url,this.connector.getBridgeService(),OPEN_URL_MODE.Blank);
          return;
        }

        this.renderedNode = node;
        const queryParams = {
            repository: RestNetworkService.isFromHomeRepo(
                node,
                this.allRepositories,
            )
                ? null
                : node.ref.repo,
            comments: event.source == 'comments' ? true : null,
        };
        this.router.navigate(
            [UIConstants.ROUTER_PREFIX + 'render', node.ref.id],
            { queryParams: queryParams,
                state: {
                    scope: 'search'
                }
            },
        );
    }

    switchToCollections(id = '') {
        UIHelper.getCommonParameters(this.activatedRoute).subscribe(params => {
            params.id = id;
            this.router.navigate([UIConstants.ROUTER_PREFIX + 'collections'], {
                queryParams: params,
            });
        });
    }

    setDisplayType(type: NodeEntriesDisplayType) {
        this.searchService.displayType = type;
        this.router.navigate(['./'], {
            relativeTo: this.activatedRoute,
            queryParams: {
                'displayType': type ?? null,
            },
            queryParamsHandling: 'merge'
        });
    }

    processSearchResult(data: SearchList, init: boolean) {
        /*
        if (this.currentRepository == RestConstants.ALL && this.groupResults) {
            this.searchService.searchResultRepositories.push(data.nodes);
        } else {
            this.searchService.dataSourceSearchResult.appendData(data.nodes)
        }
        */
        this.searchService.ignored = data.ignored;
        if (
            data.nodes.length < 1 &&
            this.currentRepository != RestConstants.ALL
        ) {
            this.searchService.dataSourceSearchResult[0].isLoading = false;
            this.isSearching = false;
            this.searchService.complete = true;
            return;
        }
    }

    // private getMdsFacets(facets: Facette[]): FacetValues {
    //     // TODO: consider doing this in an MDS service.
    //     const result: FacetValues = {};
    //     for (const facet of facets ?? []) {
    //         result[facet.property] = [];
    //         const widget = MdsHelper.getWidget(facet.property, null, this.currentMdsSet?.widgets);
    //         for (let value of facet.values) {
    //             const cap = widget?.values?.find((v: any) => v.id === value.value);
    //             result[facet.property].push({
    //                 id: value.value,
    //                 caption: cap ? cap.caption : value.value,
    //                 count: value.count,
    //             });
    //         }
    //     }
    //     return result;
    // }

    updateMds() {
        this.currentValues = null;
        this.routeSearch(
            this.searchService.searchTerm,
            this.currentRepository,
            this.mdsId,
            null,
        );
    }

    updateSort(sort: ListSortConfig) {
        this.searchService.sort = sort;
        this.applyParameters('sort');
    }

    permissionAddToCollection(node: Node) {
        if (node.access.indexOf(RestConstants.ACCESS_CC_PUBLISH) == -1) {
            let button: any = null;
            if (
                node.properties[RestConstants.CCM_PROP_QUESTIONSALLOWED] &&
                node.properties[RestConstants.CCM_PROP_QUESTIONSALLOWED][0] ==
                    'true'
            ) {
                button = {
                    icon: 'message',
                    caption: 'ASK_CC_PUBLISH',
                    click: () => {
                        this.nodeHelper.askCCPublish(node);
                    },
                };
            }
            return { status: false, message: 'NO_CC_PUBLISH', button: button };
        }
        return { status: true };
    }

    isWorkspaceEnabled() {
        return ConfigurationHelper.hasMenuButton(this.config, 'workspace');
    }

    setSavedSearchQuery(query: string) {
        this.savedSearchQuery = query;
        this.loadSavedSearch();
    }

    isHomeRepository() {
        return RestNetworkService.isHomeRepo(
            this.currentRepository,
            this.allRepositories,
        );
    }
    hasMobileMds() {
        return this.searchService.sidenavOpened && this.isMobileWidth() && this.isMobileHeight();
    }
    toggleSidenav() {
        this.searchService.sidenavOpened = !this.searchService.sidenavOpened;
        this.setFixMobileNav();
        // init mobile mds
        if(this.hasMobileMds()) {
            this.uiService.waitForComponent(this, 'mdsMobileRef').subscribe(() => {
                this.mdsMobileRef.loadMds();
            });
        }
        setTimeout((() => {
            // recalculate the filter layout
            this.handleScroll();
            if (this.searchService.sidenavOpened) {
                this.focusSidenav();
            }
        }));

    }

    private focusSidenav() {
        this.sidenavRef.nativeElement.setAttribute('tabindex', '-1');
        this.sidenavRef.nativeElement.focus();
        const removeTabindex = () => {
            this.sidenavRef.nativeElement.removeAttribute('tabindex');
            this.sidenavRef.nativeElement.removeEventListener('blur', removeTabindex);
        };
        this.sidenavRef.nativeElement.addEventListener('blur', removeTabindex);
    }

    // @TODO
    /*
    getSearchResultCollections(): Node[] {
        if (this.collectionsMore) {
            return this.searchService.searchResultCollections;
                    } else {
                        return searchResultCollections.slice(0, collectionsPerRow);
                    }
                }),
            )
            .subscribe((visibleCollections) =>
                this.visibleCollectionsSubject.next(visibleCollections),
            );
    }

    private registerCollectionsPerRow(): void {
        this.collectionsContainerWidthSubject
            .pipe(
                map((width) => this.collectionsPerRow(width)),
            )
            .subscribe((collectionsPerRow) =>
                this.collectionsPerRowSubject.next(collectionsPerRow),
            );
    }
     */

    private updateSortMds() {
        // when mds is not ready, we can't update just now
        if (this.currentMdsSet == null) {
            return null;
        }
        return MdsHelper.getSortInfo(this.currentMdsSet, 'search');
    }

    private updateSortState() {
        let sort = this.updateSortMds();
        if (sort) {
            const columns = sort.columns.map((c) =>
                new ListItemSort('NODE', c.id, (c.mode as any))
            );
            // do not update state if current state is valid (otherwise sort info is lost when comming back from rendering)
            // exception: if there is no state at all, refresh it with the default
            if (this.searchService.sort) {
                this.searchService.sort.columns = columns;
                return;
            }
            this.searchService.sort = {
                active: sort.default.sortBy,
                direction: sort.default.sortAscending ? 'asc' : 'desc',
                columns
            };
        } else {
            this.searchService.sort = {
                active: null,
                direction: undefined,
                columns: []
            };
        }
    }

    private updateColumns() {
        this.searchService.columns = MdsHelper.getColumns(
            this.translate,
            this.currentMdsSet,
            'search',
        );
        this.searchService.collectionsColumns = MdsHelper.getColumns(
            this.translate,
            this.currentMdsSet,
            'searchCollections'
        )
    }

    private importNode(
        nodes: Node[],
        pos = 0,
        errors = false,
        lastData: Node = null,
    ) {
        if (pos >= nodes.length) {
            this.globalProgress = false;
            let additional;
            if (nodes.length == 1 && lastData) {
                additional = {
                    link: {
                        caption: 'SEARCH.NODE_IMPORTED_VIEW',
                        callback: () => {
                            UIHelper.goToWorkspace(
                                this.nodeApi,
                                this.router,
                                this.login,
                                lastData,
                            );
                        },
                    },
                };
            }
            if (!errors)
                this.toast.toast(
                    'SEARCH.NODE_IMPORTED',
                    null,
                    null,
                    null,
                    additional,
                );
            return;
        }
        this.globalProgress = true;
        this.nodeApi
            .importNode(
                nodes[pos].ref.repo,
                nodes[pos].ref.id,
                RestConstants.INBOX,
            )
            .subscribe(
                (data: NodeWrapper) => {
                    this.importNode(nodes, pos + 1, errors, data.node);
                },
                (error: any) => {
                    this.toast.error(error);
                    this.importNode(nodes, pos + 1, true, null);
                },
            );
    }

    private getWorkspaceUrl(node: Node) {
        return (
            UIConstants.ROUTER_PREFIX +
            'workspace/files?root=MY_FILES&id=' +
            node.parent.id +
            '&file=' +
            node.ref.id
        );
    }

    private addToStream(node: Node) {
        let nodes = ActionbarHelperService.getNodes(this.getSelection(), node);
        this.addNodesStream = nodes;
    }

    private printListener() {
        // not working properly
        /*
    let mediaQueryList = window.matchMedia('print');
    mediaQueryList.addListener((mql)=> {
      let lastType=-1;
      if (mql.matches) {
        lastType=this.view;
        this.view=ListTableComponent.VIEW_TYPE_LIST;
      } else if(lastType!=-1) {
        this.view=lastType;
        lastType=-1;
      }
    });
    */
    }

    private addToStore(selection: Node[]) {
        this.globalProgress = true;
        RestHelper.addToStore(selection, this.bridge, this.iam, () => {
            this.globalProgress = false;
            this.nodeEntriesResults.getSelection().clear();
            this.mainNavRef.refreshNodeStore();
        });
    }

    async onMdsReady(mds: any = null) {
        this.currentMdsSet = mds;
        this.updateColumns();
        this.updateSortState();
        if (!this.searchService.dataSourceSearchResult[0] || this.searchService.dataSourceSearchResult[0]?.isEmpty()) {
            this.initalized = true;
            if (!this.currentValues && this.getActiveMds()) {
                this.currentValues = await this.getMdsValues();
            }
        }
        if (this.mainNavRef && !this.bannerInitalized) {
            await this.mainNavRef.refreshBanner();
            this.handleScroll();
            this.bannerInitalized = true;
        }
        this.searchService.reinit = true;
    }

    private prepare(param: Params): void {
        if (this.setSidenavSettings()) {
            // auto, never, always
            let sidenavMode = this.config.instant('searchSidenavMode', 'never');
            if (sidenavMode == 'never') {
                this.searchService.sidenavOpened = false;
            }
            if (sidenavMode == 'always') {
                this.searchService.sidenavOpened = true;
            }
        }
        this.connector.isLoggedIn().subscribe((data: LoginResult) => {
            this.toolPermissions = data.toolPermissions;
            if (data.isValidLogin && data.currentScope != null) {
                RestHelper.goToLogin(this.router, this.config);
                return;
            }
            this.login = data;
            this.isGuest = data.isGuest;
            this.updateMdsActions();
            this.mdsExtended = false;
            this.loadSavedSearch();
            if (param['mdsExtended'])
                this.mdsExtended = param['mdsExtended'] == 'true';
            if (param['materialsSortBy']) {
                // set a valid state first
                this.updateSortState();
                this.searchService.sort.active = param['materialsSortBy'];
                this.searchService.sort.direction = param['materialsSortAscending'] === 'true' ? 'asc' : 'desc';
            }
            if (param.parameters) {
                this.searchService.extendedSearchUsed = true;
                this.currentValues = JSON.parse(param['parameters']);
            } else if (this.currentValues) {
                this.currentValues = null;
            }
            if (param['savedQuery']) {
                this.nodeApi
                    .getNodeMetadata(param['savedQuery'], [RestConstants.ALL])
                    .subscribe((data: NodeWrapper) => {
                        this.loadSavedSearchNode(data.node);
                    });
            } else {
                this.invalidateMds();
            }
            this.searchService.init();
        });
    }

    getSourceIcon(repo: Repository) {
        return this.nodeHelper.getSourceIconRepoPath(repo);
    }

    private getCurrentNode(node: Node) {
        return node ? node : this.getSelection()[0];
    }

    private searchRepository(
        repos: any[],
        criteria: SearchRequestCriteria[],
        init: boolean,
        position = 0,
        count = 0,
        tryFrontpage = true
    ) {
        if (position > 0 && position >= repos.length) {
            this.searchService.numberofresults = count;
            this.searchService.dataSourceSearchResult[0].isLoading = false;
            this.isSearching = false;
            return;
        }
        this.searchService.dataSourceSearchResult[0].isLoading = true;
        let repo = repos[position];
        if (!repo.enabled) {
            this.searchRepository(repos, criteria, init, position + 1, count);
            return;
        }

        // default order: lucene score, modified date
        let sortBy = [
            RestConstants.LUCENE_SCORE,
            RestConstants.CM_MODIFIED_DATE,
        ];
        let sortAscending = [false, false];

        // order set by user and order is not of type score (which would be the default mode)
        if (
            this.searchService.sort.active &&
            this.searchService.sort.active !== RestConstants.LUCENE_SCORE
        ) {
            sortBy = [this.searchService.sort.active];
            sortAscending = [this.searchService.sort.direction === 'asc'];
        }
        let mdsId = this.mdsId;
        if (this.currentRepository == RestConstants.ALL) {
            const mdsAllowed = ConfigurationHelper.filterValidMds(
                repo,
                null,
                this.config,
            );
            if (mdsAllowed) {
                mdsId = mdsAllowed[0];
            }
        }
        let properties = [RestConstants.ALL];
        const request = {
            sortBy,
            sortAscending,
            count:
                this.currentRepository == RestConstants.ALL &&
                !this.groupResults
                    ? Math.max(
                    5,
                    Math.round(
                        this.connector.numberPerRequest /
                        (this.repositories.length - 1),
                    ),
                    )
                    : null,
            offset: this.searchService.dataSourceSearchResult[position]?.getData()?.length || 0,
            propertyFilter: [properties],
        };
        let permissions: string[];
        if(this.applyMode){
            permissions = [RestConstants.ACCESS_CC_PUBLISH];
        }
        let queryRequest: Observable<SearchResults | NodeList> =
            this.mdsDesktopRef.mdsEditorInstance
                .getNeededFacets()
                .pipe(
                    first(),
                    switchMap((neededFacets) =>
                        this.searchApi.search({
                            body: {
                                criteria,
                                facets: neededFacets,
                                permissions,
                                facetLimit: 5,
                                facetMinCount: 1,
                            },
                            skipCount: request.offset,
                            maxItems:
                                request.count ?? this.search.getRestConnector().numberPerRequest,
                            sortProperties: request.sortBy,
                            sortAscending: request.sortAscending,
                            propertyFilter: request.propertyFilter[0],
                            contentType: 'FILES',
                            repository: repo ? repo.id : RestConstants.HOME_REPOSITORY,
                            metadataset: mdsId,
                            query: RestConstants.DEFAULT_QUERY_NAME,
                        }),
                    ),
                );
            const useFrontpage = !this.searchService.searchTerm && !this.searchService.extendedSearchUsed &&
                this.isHomeRepository() && this.config.instant('frontpage.enabled', true);
            if(useFrontpage && tryFrontpage) {
                queryRequest = this.nodeApi.getChildren(RestConstants.NODES_FRONTPAGE, [RestConstants.ALL], request);
            }
            queryRequest.subscribe(
                async (data: SearchList) => {
                    if (!this.searchService.dataSourceSearchResult[position]) {
                        this.searchService.dataSourceSearchResult[position] = new NodeDataSource<Node>();
                        this.searchService.dataSourceSearchResult[position].setData(data.nodes, data.pagination);
                    } else {
                        this.searchService.dataSourceSearchResult[position].appendData(data.nodes);
                        this.searchService.dataSourceSearchResult[position].setPagination(data.pagination);
                    }
                    await this.nodeEntriesResults.initOptionsGenerator({
                        actionbar: this.actionbarComponent,
                        customOptions: this.customOptions,
                        scope: Scope.Search
                    });
                    this.processSearchResult(data, init);
                    this.searchService.showchosenfilters = true;
                    this.searchRepository(
                        repos,
                        criteria,
                        init,
                        position + 1,
                        count + data.pagination.total,
                    );
                }, error => {
                    if(useFrontpage && tryFrontpage && count === 0){
                        console.warn('Could not fetch frontpage data, will fallback to a regular search', error);
                        this.searchRepository(
                            repos,
                            criteria,
                            init,
                            position,
                            count,
                            false
                        );
                        return;
                    }
                    this.toast.error(error);
                    this.searchRepository(
                        repos,
                        criteria,
                        init,
                        position + 1,
                        count,
                    );
                },
            );
    }

    getSourceIconPath(path: string) {
        return this.nodeHelper.getSourceIconPath(path);
    }

    private updateRepositoryOrder() {
        if (!this.repositories) return;
        if (this.repositories.length > 4) {
            let hit = false;
            for (let i = 3; i < this.repositories.length; i++) {
                if (this.currentRepository == this.repositories[i].id) {
                    Helper.arraySwap(this.repositories, i, 3);
                    this.extendedRepositorySelected = true;
                    break;
                }
            }
        }
        if (this.repositoryIds.length == 0) {
            this.repositoryIds = [];
            for (let repo of this.repositories) {
                if (repo.id == RestConstants.ALL || repo.id == 'MORE') continue;
                this.repositoryIds.push({
                    id: repo.id,
                    title: repo.title,
                    enabled: this.enabledRepositories
                        ? this.enabledRepositories.indexOf(repo.id) != -1
                        : true,
                });
            }
            this.updateGroupedRepositories();
        }
    }
    private getActiveMds() {
        return this.hasMobileMds() ? this.mdsMobileRef : this.mdsDesktopRef;
    }
    private updateMdsActions(): void {
        this.savedSearchOptions.addOptions = [];
        this.mdsActions = [];
        if (!this.isGuest) {
            this.mdsActions.push(
                new OptionItem(
                    this.applyMode
                        ? 'SEARCH.EMBED_SEARCH_ACTION'
                        : 'SEARCH.SAVE_SEARCH_ACTION',
                    this.applyMode ? 'redo' : 'save',
                    () => {
                        this.saveSearchDialog = true;
                    },
                ),
            );
        }
        if (this.applyMode) {
            this.savedSearchOptions.addOptions.push(
                new OptionItem('APPLY', 'redo', (node: Node) => {
                    this.nodeHelper.addNodeToLms(
                        node,
                        this.searchService.reurl,
                    );
                }),
            );
        }
        const searchAction = new OptionItem('SEARCH.APPLY_FILTER', 'search', async () => {
            this.applyParameters('mds', await this.getActiveMds().getValues());
        });
        searchAction.isPrimary = true;
        if (this.mdsDesktopRef?.editorType === 'legacy') {
            this.mdsActions.push(searchAction);
        }
        this.mdsButtons = DialogButton.fromOptionItem([searchAction]);
    }

    closeSaveSearchDialog() {
        this.saveSearchDialog = false;
    }

    saveSearch(name: string, replace = false) {
        this.search
            .saveSearch(
                name,
                this.queryId,
                this.getCriterias(),
                this.currentRepository,
                this.mdsId,
                replace,
            )
            .subscribe(
                (data: NodeWrapper) => {
                    this.saveSearchDialog = false;
                    this.toast.toast('SEARCH.SAVE_SEARCH.TOAST_SAVED');
                    this.loadSavedSearch();
                    if (this.applyMode) {
                        this.nodeHelper.addNodeToLms(
                            data.node,
                            this.searchService.reurl,
                        );
                    }
                },
                (error: any) => {
                    if (
                        error.status === RestConstants.DUPLICATE_NODE_RESPONSE
                    ) {
                        this.toast.showConfigurableDialog({
                            title: 'SEARCH.SAVE_SEARCH.SEARCH_EXISTS_TITLE',
                            message: 'SEARCH.SAVE_SEARCH.SEARCH_EXISTS_MESSAGE',
                            buttons: [
                                new DialogButton(
                                    'RENAME',
                                    DialogButton.TYPE_CANCEL,
                                    () => this.toast.closeModalDialog(),
                                ),
                                new DialogButton(
                                    'REPLACE',
                                    DialogButton.TYPE_PRIMARY,
                                    () => {
                                        this.toast.closeModalDialog();
                                        this.saveSearch(name, true);
                                    },
                                ),
                            ],
                            isCancelable: true,
                        });
                    } else {
                        this.toast.error(error);
                    }
                },
            );
    }

    private getCriterias(
        properties = this.currentValues,
        searchString = this.searchService.searchTerm,
        addAll = true,
    ) {
        let criterias: SearchRequestCriteria[] = [];
        if (searchString)
            criterias.push({
                property: RestConstants.PRIMARY_SEARCH_CRITERIA,
                values: [searchString],
            });
        if (!addAll) return criterias;
        if (properties) {
            criterias = criterias.concat(
                RestSearchService.convertCritierias(
                    properties,
                    this.getActiveMds().currentWidgets,
                ),
            );
        }
        return criterias;
    }

    loadSavedSearchNode(node: Node) {
        this.extendedSearchSelectedTab.setValue(0);
        UIHelper.routeToSearchNode(this.router, this.searchService.reurl, node);
        this.currentSavedSearch = node;
    }

    goToSaveSearchWorkspace() {
        this.nodeApi
            .getNodeMetadata(RestConstants.SAVED_SEARCH)
            .subscribe((data: NodeWrapper) => {
                UIHelper.goToWorkspaceFolder(
                    this.nodeApi,
                    this.router,
                    this.login,
                    data.node.ref.id,
                );
            });
    }

    loadSavedSearch() {
        if (!this.isGuest) {
            this.savedSearch = [];
            this.savedSearchLoading = true;
            let request: any = {
                propertyFilter: [RestConstants.ALL],
                sortBy: [RestConstants.LOM_PROP_TITLE],
                sortAscending: true,
                offset: 0,
            };
            if (this.savedSearchOwn) {
                request.count = RestConstants.COUNT_UNLIMITED;
                this.nodeApi
                    .getChildren(RestConstants.SAVED_SEARCH, [], request)
                    .subscribe((data: NodeList) => {
                        data.nodes = data.nodes.filter(
                            node =>
                                node.type ==
                                RestConstants.CCM_TYPE_SAVED_SEARCH,
                        );
                        this.savedSearch = data.nodes;
                        this.savedSearchLoading = false;
                    });
            } else {
                this.search
                    .searchSimple(
                        'saved_search',
                        [],
                        this.savedSearchQuery,
                        request,
                        RestConstants.CONTENT_TYPE_ALL,
                    )
                    .subscribe((data: NodeList) => {
                        this.savedSearch = data.nodes;
                        this.savedSearchLoading = false;
                    });
            }
        }
    }

    private async invalidateMds() {
        if (this.currentRepository == RestConstants.ALL) {
            this.onMdsReady();
        } else {
            await this.getActiveMds().loadMds();
            //this.onMdsReady();
            //this.getActiveMds().loadMds();
        }
    }

    private initParams() {
        this.activatedRoute.queryParams.pipe(takeUntil(this.destroyed$)).subscribe(
            (param) => {
                if(this.oldParams) {
                    // check if reinit can be skipped (e.g. if only view relevant params changed)
                    let reinit = false;
                    for (const key of Object.keys(param || {}).concat(Object.keys(this.oldParams))) {
                        if (this.oldParams[key] === param[key]) {
                            continue;
                        }
                        if (key === UIConstants.QUERY_PARAM_LIST_VIEW_TYPE) {
                            continue;
                        }
                        reinit = true;
                    }
                    this.oldParams = param;
                    if (!reinit) {
                        return;
                    }
                } else {
                    this.oldParams = param;
                }

                this.searchService.init();
                this.mainNavRef.refreshBanner();
                GlobalContainerComponent.finishPreloading();
                this.hasCheckbox = true;
                this.searchService.reurl = null;
                if (param.displayType != null) {
                    this.setDisplayType(parseInt(param.displayType, 10));
                }
                if (param.addToCollection) {
                    const addTo = new OptionItem('SEARCH.ADD_INTO_COLLECTION_SHORT','layers', (node) => {
                        this.mainNavRef.management.addToCollectionList(this.addToCollection,
                            ActionbarHelperService.getNodes(this.getSelection(),node), true, () => {
                                this.switchToCollections(this.addToCollection.ref.id);
                            });
                    });
                    addTo.elementType = OptionsHelperService.ElementTypesAddToCollection;
                    addTo.group = DefaultGroups.Reuse;
                    addTo.showAlways = true;
                    const cancel = new OptionItem('CANCEL', 'close', () => {
                        this.router.navigate([UIConstants.ROUTER_PREFIX, 'collections'], {queryParams: {id: this.addToCollection.ref.id}});
                    });
                    cancel.group = DefaultGroups.Delete;
                    cancel.elementType = [ElementType.Unknown];
                    this.collectionApi
                        .getCollection(param.addToCollection)
                        .subscribe(
                            (data: CollectionWrapper) => {
                                this.addToCollection = data.collection;
                                // add to collection layout is only designed for GRIDS, otherwise missing permission info will fail
                                this.setDisplayType(
                                    NodeEntriesDisplayType.Grid
                                );
                                this.customOptions = {
                                    useDefaultOptions: false,
                                    addOptions: [
                                        cancel,
                                        addTo
                                    ]
                                };
                            },
                            error => {
                                this.toast.error(error);
                            },
                        );
                } else if (param.reurl) {
                    this.searchService.reurl = param.reurl;
                    this.applyMode = true;
                    this.hasCheckbox = false;
                } else if (param.savedSearch) {
                    this.nodeApi
                        .getNodeMetadata(param.savedSearch, [RestConstants.ALL])
                        .subscribe(node => {
                            this.loadSavedSearchNode(node.node);
                        });
                    return;
                }
                this.mainnav = param.mainnav !== 'false';
                if (param.sidenav) {
                    this.searchService.sidenavOpened =
                        param.sidenav !== 'false';
                }
                if (param.query) {
                    this.searchService.searchTerm = param.query;
                }
                if (param.repositoryFilter) {
                    this.enabledRepositories = param['repositoryFilter'].split(
                        ',',
                    );
                    // do a reload of the repos
                    this.repositoryIds = [];
                }

                let paramRepo = param.repository;
                if (!paramRepo) {
                    paramRepo = RestConstants.HOME_REPOSITORY;
                }
                let previousRepository = this.currentRepository;
                this.mdsSets = null;
                if (this.currentRepository != paramRepo) {
                    this.mdsId = RestConstants.DEFAULT;
                }
                this.currentRepository = paramRepo;
                this.updateRepositoryOrder();
                this.updateCurrentRepositoryId();
                if (
                    this.config.instant('availableRepositories') &&
                    this.repositories.length &&
                    this.currentRepository != RestConstants.ALL &&
                    RestNetworkService.getRepositoryById(
                        this.currentRepository,
                        this.repositories,
                    ) == null
                ) {
                    let use = this.config.instant('availableRepositories');
                    console.info(
                        'current repository ' +
                            this.currentRepository +
                            ' is restricted by context, switching to primary ' +
                            use[0], use,
                    );
                    this.routeSearch(
                        this.searchService.searchTerm,
                        use[0],
                        RestConstants.DEFAULT,
                    );
                }
                if (this.currentRepository != previousRepository) {
                    this.currentValues = null;
                }
                this.updateSelection([]);
                let repo = this.currentRepository;
                this.mds.getAvailableMetadataSets(repo).subscribe(
                    (metadataSets: MetadataSetInfo[]) => {
                        if (repo != this.currentRepository) {
                            return;
                        }
                        this.mdsSets = ConfigurationHelper.filterValidMds(
                            this.currentRepositoryObject
                                ? this.currentRepositoryObject
                                : this.currentRepository,
                            metadataSets,
                            this.config,
                        );
                        if (this.mdsSets) {
                            UIHelper.prepareMetadatasets(
                                this.translate,
                                this.mdsSets,
                            );
                            try {
                                this.mdsId = this.mdsSets[0].id;
                                if (
                                    param.mds &&
                                    Helper.indexOfObjectArray(
                                        this.mdsSets,
                                        'id',
                                        param.mds,
                                    ) !== -1
                                ) {
                                    this.mdsId = param.mds;
                                }
                            } catch (e) {
                                console.warn(
                                    'got invalid mds list from repository:',
                                );
                                console.warn(this.mdsSets);
                                console.warn('will continue with default mds');
                                this.mdsId = RestConstants.DEFAULT;
                            }
                            this.prepare(param);
                        }
                    },
                    (error: any) => {
                        this.mdsId = RestConstants.DEFAULT;
                        this.prepare(param);
                    },
                );
            },
        );
    }

    private updateCurrentRepositoryId() {
        this.currentRepositoryObject = RestNetworkService.getRepositoryById(
            this.currentRepository,
            this.allRepositories,
        );
        if (
            this.currentRepository == RestConstants.HOME_REPOSITORY &&
            this.currentRepositoryObject
        ) {
            this.currentRepository = this.currentRepositoryObject.id;
        }
        this.searchService.setRepository(this.currentRepository);
    }

    private getEnabledRepositories() {
        if (this.repositoryIds && this.repositoryIds.length) {
            let result = [];
            for (let repo of this.repositoryIds) {
                if (repo.enabled) result.push(repo.id);
            }
            return result;
        }
        return null;
    }

    private setFixMobileNav() {
        this.mainNavRef.setFixMobileElements(
            this.searchService.sidenavOpened ||
                (this.getSelection()?.length > 0),
        );
    }

    getSelection() {
        return this.nodeEntriesResults?.getSelection()?.selected;
    }

    private registerSearchOnMdsUpdate(): void {
        rxjs.merge(this.searchField.filterValuesChange, this.mdsDesktopRef.mdsEditorInstance.values)
            .pipe(
                takeUntil(this.destroyed$),
                map((valuesDict) =>
                    Object.entries(valuesDict).reduce((acc, [property, values]) => {
                        if (values?.length > 0) {
                            acc[property] = values;
                        }
                        return acc;
                    }, {} as { [property: string]: string[] }),
                ),
                map((valuesDict) => JSON.stringify(valuesDict)),
                distinctUntilChanged(),
                map((json) => JSON.parse(json)),
            )
            .subscribe((values) => this.applyParameters('mds', values));
        this.mdsDesktopRef.mdsEditorInstance.mdsInitDone
            .pipe(
                takeUntil(this.destroyed$),
                // Wait for `MdsEditorWrapper` to reflect `editorType`.
                delay(0),
            ).subscribe(() => this.updateMdsActions());
    }
}
