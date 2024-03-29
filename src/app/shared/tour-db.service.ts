import { Injectable } from '@angular/core';

import { Tour } from './tour';
import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import {Observable, throwError} from 'rxjs';
import {TourRaw} from './tour-raw';
import {catchError, map, retry} from 'rxjs/operators';
import {TourFactory} from './tour-factory';
import {Comment} from './comment';
import {ActivityType} from './activity-type';
import {Location} from './location';
import {environment} from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TourDbService {
  private apiURL = environment.apiUrl;

  constructor(private http: HttpClient) {

  }

  getAllTours(search: any): Observable<Tour[]> {

    if (search.lat) {

      const jsonEncoded = btoa(JSON.stringify( {
        only: ['name', 'id'],
        lat: search.lat,
        long: search.long,
        dist: search.dist
      }));
      return this.http.get<TourRaw[]>(
        `${this.apiURL}/main/find_tour/${jsonEncoded}`)
        .pipe(
          retry(3),
          map(toursRaw => toursRaw.map(t => TourFactory.fromRaw(t)),
            ),
          catchError(this.errorHandler)
        );
    }
    if (search.country) {
      if (search.country === '-1') {

        const jsonEncoded = btoa(JSON.stringify({
          order_by: {
            column: 'name',
            dir: 'asc'
          },
          output: ['id', 'name']
        }));

        return this.http.get<TourRaw[]>(
          `${this.apiURL}/main/list/activity/${jsonEncoded}`)
          .pipe(
            retry(3),
            map(toursRaw => toursRaw.map(t => TourFactory.fromRaw(t)),
          ),
          catchError(this.errorHandler)
        );
      }
      else {

        const jsonEncoded = btoa(JSON.stringify( {
          keys : {
            country_id: search.country
          },
          order_by: {
            column: 'name',
            dir: 'asc'
          },
          output: ['id', 'name'],
          enrich: {
            get_location: 'name',
            get_region: 'name'
          }
        }));

        return this.http.get<TourRaw[]>(
          `${this.apiURL}/main/find_tour_by_area/${jsonEncoded}`)
          .pipe(
            retry(3),
            map(toursRaw => toursRaw.map(t => TourFactory.fromRaw(t)),
          ),
          catchError(this.errorHandler)
        );
      }
    }
    if (search.region) {

      const jsonEncoded = btoa(JSON.stringify({
        keys: {
          id: search.region
        },
        order_by: {
          column: 'name',
          dir: 'asc'
        },
        output: ['id', 'name'],
        enrich: {
          get_location: 'name',
          get_region: 'name'
        }
      }));

      return this.http.get<TourRaw[]>(
        `${this.apiURL}/main/find_tour_by_area/${jsonEncoded}`)
        .pipe(
          retry(3),
          map(toursRaw => toursRaw.map(t => TourFactory.fromRaw(t)),
        ),
        catchError(this.errorHandler)
      );
    }
  }

  getTourByID(id: string): Observable<Tour> {

    const jsonEncoded = btoa(JSON.stringify(
      {
        output : ['name', 'id', 'description', 'source'],
        enrich: {
          get_activity_type: 'name',
          get_country_all: 'abbreviation',
          get_location_all: 'name',
          get_location_type_all: 'id'
        }
      }
    ));
    return this.http.get<TourRaw>(
      `${this.apiURL}/main/find/activity/${id}/${jsonEncoded}`)
      .pipe(
        retry(3),
        map(t => TourFactory.fromRaw(t)),
        catchError(this.errorHandler)
      );
  }

  getTourByTerm(searchTerm: string): Observable<Tour[]> {

    const jsonEncoded = btoa(JSON.stringify({
      term: searchTerm,
      output: ['name', 'id'],
      enrich: {
        get_location: 'name',
        get_region: 'name',
        get_country: 'abbreviation'
      }
    }));

    return this.http.get<TourRaw[]>(
      `${this.apiURL}/main/find_tour_by_term/${jsonEncoded}`)
      .pipe(
        retry(3),
        map(toursRaw => toursRaw.map(t => TourFactory.fromRaw(t))),
        catchError(this.errorHandler)
      );
  }

  getCommentByAct(actID: string): Observable<Comment[]> {

    const jsonEncoded = btoa(JSON.stringify({	keys: {
        activity_id: actID
      },
      order_by: {
        column: 'updated_at',
        dir: 'asc'
      },
      output: ['id', 'body', 'updated_at']
    }));
    return this.http.get<Comment[]>(
      `${this.apiURL}/main/list/comment/${jsonEncoded}`)
      .pipe(
        retry(3),
        catchError(this.errorHandler)
      );
  }

  getPDF(actID: string) {
    const httpOptions = {
      responseType: 'blob' as 'json'
    };

    return this.http.get(
      `${this.apiURL}/main/file/${actID}`,
      httpOptions)
      .pipe(
        retry(3),
        catchError(this.errorHandler)
      );
  }

  createComment(comment: Comment): Observable<any> {
    return this.http.post(
      `${this.apiURL}/main/create/comment`,
      {
        body: comment.body,
        activity_id: comment.activityID
      },
      {
        responseType: 'text'
      })
      .pipe(
        catchError(this.errorHandler)
      );
  }

  getActivityTypes(): Observable<ActivityType[]> {

    const jsonEncoded = btoa(JSON.stringify({
      order_by: {
        column: 'name',
        dir: 'asc'
      },
      output: ['name', 'id']
    }));

    return this.http.get<ActivityType[]>(
      `${this.apiURL}/main/list/activity_type/${jsonEncoded}`)
      .pipe(
        retry(3),
        catchError(this.errorHandler)
      );
  }

  getLocations(): Observable<Location[]> {

    const jsonEncoded = btoa(JSON.stringify({
      order_by: {
        column: 'name',
        dir: 'asc'
      },
      output: ['name', 'id']
    }));

    return  this.http.get<Location[]>(
      `${this.apiURL}/main/list/location/${jsonEncoded}`)
      .pipe(
        retry(3),
        catchError(this.errorHandler)
      );
  }

  getCountries(): Observable<any[]> {
    const jsonEncoded = btoa(JSON.stringify({
      order_by: {
        column: 'name',
        dir: 'asc'
      },
      output: ['name', 'id', 'abbreviation']
    }));

    return this.http.get(
      `${this.apiURL}/main/list/country/${jsonEncoded}`)
      .pipe(
        retry(3),
        catchError(this.errorHandler)
    );
  }

  getRegionByCountry(countryID: string): Observable<any[]> {

    const jsonEncoded = btoa(JSON.stringify({
      keys: {
        country_id: countryID
      },
      order_by: {
        column: 'name',
        dir: 'asc'
      },
      output: ['name', 'id']
    }));

    return this.http.get(
      `${this.apiURL}/main/list/region/${jsonEncoded}`)
      .pipe(
        retry(3),
        catchError(this.errorHandler)
    );
  }

  hike(actID: string, typ: string): Observable<any> {
    return this.http.get(
      `${this.apiURL}/main/hike/${actID}?typ=${typ}`)
      .pipe(
        retry(3),
        catchError(this.errorHandler)
      );
  }

  getHikes(actID: string): Observable<any> {
    return this.http.get(
      `${this.apiURL}/main/stats/hikes/${actID}`)
      .pipe(
        retry(3),
        catchError(this.errorHandler)
      );
  }

  getGeneralStats(): Observable<any> {
    return this.http.get(
      `${this.apiURL}/main/stats`)
      .pipe(
        retry(3),
        catchError(this.errorHandler)
      );
  }

  private errorHandler(error: HttpErrorResponse): Observable<any> {
    console.error('Etwas ging schief');
    return throwError(error);
  }
}
