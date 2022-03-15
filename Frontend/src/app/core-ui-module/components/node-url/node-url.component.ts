import { Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { Node } from '../../../core-module/rest/data-object';
import { NodeHelperService } from '../../node-helper.service';
import { ListTableComponent } from '../list-table/list-table.component';

// TODO: Decide if providing focus highlights and ripples with this component is a good idea. When
// using `app-node-url` for cards, we might need highlights and ripples for the whole card while
// `app-node-url` should only wrap the title since links with lots of content confuse screen
// readers.

@Component({
    selector: 'es-node-url',
    templateUrl: 'node-url.component.html',
    styleUrls: ['node-url.component.scss'],
})
export class NodeUrlComponent {
    @ViewChild('link') link: ElementRef;

    @Input() listTable: ListTableComponent;
    @Input() node: Node;
    @Input() nodes: Node[];
    @Input() scope: string;
    /**
     * link: a element
     * button: button element
     * wrapper: div element with behavior "like" a link
     */
    @Input() mode: 'link' | 'button' | 'wrapper' = 'link';
    @Input() disabled = false;
    /**
     * Show the ripple effect even when disabled.
     *
     * @deprecated Temporary workaround for list-table, which *sometimes* uses it's on click
     * bindings.
     */
    @Input() alwaysRipple = false;
    @Input('aria-describedby') ariaDescribedby: string;
    @Input('aria-label') ariaLabel = true;

    @Output() buttonClick = new EventEmitter<MouseEvent>();

    constructor(private nodeHelper: NodeHelperService) {}

    getState() {
        return {
            scope: this.scope,
        };
    }

    get(mode: 'routerLink' | 'queryParams'): any {
        return this.nodeHelper.getNodeLink(mode, this.node);
    }

    focus(): void {
        this.link.nativeElement.focus();
    }

    clickWrapper(event: MouseEvent) {
        const eventCopy = copyClickEvent(event);
        this.link.nativeElement.dispatchEvent(eventCopy);
        event.preventDefault();
    }
}

function copyClickEvent(event: MouseEvent): MouseEvent {
    // It would seem better to use `event.type` instead of hard-coding 'click', but that doesn't
    // have the desired effect for non-click events when dispatched.
    return new MouseEvent('click', getMouseEventProperties(event));
}

/**
 * Returns an object with those properties of `event` that are part of its `MouseEvent` prototype.
 * 
 * @param event An instance of a class derived from `MouseEvent`
 */
function getMouseEventProperties(event: MouseEvent): MouseEventInit {
    let mouseEvent = event;
    while (mouseEvent.constructor.name !== MouseEvent.name) {
        mouseEvent = Object.getPrototypeOf(mouseEvent);
    }
    return Object.keys(mouseEvent).reduce((acc, key) => {
        const value = event[key as keyof MouseEvent];
        if (value !== null && typeof value !== 'function') {
            acc[key] = value;
        }
        return acc;
    }, {} as any);
}
