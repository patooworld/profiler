/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// @flow
import * as React from 'react';
import { DivWithTooltip } from 'firefox-profiler/components/tooltip/DivWithTooltip';
import { displayNiceUrl } from 'firefox-profiler/utils';
import { formatSeconds } from 'firefox-profiler/utils/format-numbers';

import type {
  Marker,
  MarkerIndex,
  Milliseconds,
  CssPixels,
  InnerWindowID,
  Page,
} from 'firefox-profiler/types';

import './VerticalIndicators.css';

type Props = {|
  +getMarker: (MarkerIndex) => Marker,
  +verticalMarkerIndexes: MarkerIndex[],
  +innerWindowIDToPageMap: Map<InnerWindowID, Page> | null,
  +rangeStart: Milliseconds,
  +rangeEnd: Milliseconds,
  +zeroAt: Milliseconds,
  +width: CssPixels,
  +shouldShowTooltip: boolean,
  +onRightClick: (MarkerIndex) => mixed,
|};

/**
 * This component draws vertical indicators from navigation related markers for a track
 * in the timeline.
 */
export class VerticalIndicators extends React.PureComponent<Props> {
  _onMouseDown = (e: SyntheticMouseEvent<HTMLDivElement>) => {
    if (e.button === 2 && this.props.onRightClick && e.currentTarget) {
      this.props.onRightClick(parseInt(e.currentTarget.dataset.markerIndex));
    }
    // We handled this event here, so let's avoid that it's handled also in the
    // main canvas code and empty the state.
    e.stopPropagation();
  };

  render() {
    const {
      getMarker,
      verticalMarkerIndexes,
      innerWindowIDToPageMap,
      rangeStart,
      rangeEnd,
      zeroAt,
      width,
      shouldShowTooltip,
    } = this.props;
    return verticalMarkerIndexes.map<React.Node>((markerIndex) => {
      const marker = getMarker(markerIndex);
      // Decide on the indicator color.
      let color = '#000';
      switch (marker.name) {
        case 'Navigation::Start':
          color = 'var(--grey-40)';
          break;
        case 'Load':
          color = 'var(--red-60)';
          break;
        case 'DOMContentLoaded':
          color = 'var(--blue-50)';
          break;
        default:
          if (marker.name.startsWith('Contentful paint ')) {
            color = 'var(--green-60)';
          }
      }

      // Compute the positioning
      const rangeLength = rangeEnd - rangeStart;
      const xPixelsPerMs = width / rangeLength;
      const left = (marker.start - rangeStart) * xPixelsPerMs;

      // Optionally compute a url.
      let url = null;
      const { data } = marker;
      if (
        innerWindowIDToPageMap &&
        data &&
        data.type === 'tracing' &&
        data.category === 'Navigation' &&
        data.innerWindowID
      ) {
        const page = innerWindowIDToPageMap.get(data.innerWindowID);
        if (page) {
          url = (
            <div className="timelineVerticalIndicatorsUrl">
              {displayNiceUrl(page.url)}
            </div>
          );
        }
      }

      // Create the div with a tooltip.
      return (
        <DivWithTooltip
          key={markerIndex}
          data-testid="vertical-indicator-line"
          style={{ '--vertical-indicator-color': color, left }}
          className="timelineVerticalIndicatorsLine"
          onMouseDown={this._onMouseDown}
          data-marker-index={markerIndex}
          tooltip={
            shouldShowTooltip ? (
              <>
                <div>
                  <span
                    className="timelineVerticalIndicatorsSwatch"
                    style={{ backgroundColor: color }}
                  />{' '}
                  {marker.name}
                  <span className="timelineVerticalIndicatorsDim">
                    {' at '}
                  </span>
                  <span className="timelineVerticalIndicatorsTime">
                    {formatSeconds(marker.start - zeroAt)}
                  </span>{' '}
                </div>
                {url}
              </>
            ) : null
          }
        />
      );
    });
  }
}
