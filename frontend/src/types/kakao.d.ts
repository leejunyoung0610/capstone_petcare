/**
 * 카카오맵 JavaScript SDK 타입 선언 (필요 부분만 부분 선언).
 *
 * 공식 SDK는 전역 `window.kakao` 객체로 노출되며, 우리는
 * 지도 표시 + 카테고리/키워드 검색만 사용하므로 그 부분만 정의한다.
 */

declare global {
  interface Window {
    kakao: typeof kakao;
  }

  namespace kakao.maps {
    class LatLng {
      constructor(lat: number, lng: number);
      getLat(): number;
      getLng(): number;
    }

    interface MapOptions {
      center: LatLng;
      level?: number;
    }

    class Map {
      constructor(container: HTMLElement, options: MapOptions);
      setCenter(latlng: LatLng): void;
      panTo(latlng: LatLng): void;
      getLevel(): number;
      setLevel(level: number): void;
    }

    interface MarkerImageOptions {
      offset?: Point;
      alt?: string;
    }

    class Point {
      constructor(x: number, y: number);
    }

    class Size {
      constructor(width: number, height: number);
    }

    class MarkerImage {
      constructor(src: string, size: Size, options?: MarkerImageOptions);
    }

    interface MarkerOptions {
      map?: Map;
      position: LatLng;
      title?: string;
      image?: MarkerImage;
      clickable?: boolean;
    }

    class Marker {
      constructor(options: MarkerOptions);
      setMap(map: Map | null): void;
    }

    interface InfoWindowOptions {
      content?: string | HTMLElement;
      position?: LatLng;
      removable?: boolean;
    }

    class InfoWindow {
      constructor(options: InfoWindowOptions);
      open(map: Map, marker?: Marker): void;
      close(): void;
    }

    function load(callback: () => void): void;

    namespace event {
      function addListener(target: object, type: string, handler: (...args: unknown[]) => void): void;
    }

    namespace services {
      enum Status {
        OK = "OK",
        ZERO_RESULT = "ZERO_RESULT",
        ERROR = "ERROR",
      }

      enum SortBy {
        DISTANCE = "DISTANCE",
        ACCURACY = "ACCURACY",
      }

      interface PlaceItem {
        id: string;
        place_name: string;
        category_name: string;
        category_group_code: string;
        category_group_name: string;
        phone: string;
        address_name: string;
        road_address_name: string;
        x: string; // 경도(longitude)
        y: string; // 위도(latitude)
        place_url: string;
        distance: string;
      }

      interface PlacesSearchOptions {
        location?: LatLng;
        radius?: number;
        sort?: SortBy;
        page?: number;
        size?: number;
        useMapBounds?: boolean;
      }

      type PlacesSearchCallback = (
        data: PlaceItem[],
        status: Status,
        pagination: { totalCount: number; current: number; last: number; hasNextPage: boolean }
      ) => void;

      class Places {
        constructor(map?: Map);
        keywordSearch(keyword: string, callback: PlacesSearchCallback, options?: PlacesSearchOptions): void;
        categorySearch(
          category_group_code: string,
          callback: PlacesSearchCallback,
          options?: PlacesSearchOptions
        ): void;
      }
    }
  }
}

export {};
