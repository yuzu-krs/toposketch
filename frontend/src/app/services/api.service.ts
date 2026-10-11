import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

/** バックエンド API の DTO（ASP.NET Core 側の camelCase 出力に対応）。 */
export interface DiagramDto {
  id: string;
  name: string;
  contentJson: string;
  createdAtUtc: string;
  updatedAtUtc: string;
}

export interface DiagramSummaryDto {
  id: string;
  name: string;
  createdAtUtc: string;
  updatedAtUtc: string;
  contentLengthChars: number;
}

/** /api 配下のRESTクライアント。開発時は proxy.conf.json 経由でバックエンドへ。 */
@Injectable({ providedIn: 'root' })
export class DiagramApiService {
  private readonly http = inject(HttpClient);
  private readonly base = '/api/diagrams';

  list(): Observable<DiagramSummaryDto[]> {
    return this.http.get<DiagramSummaryDto[]>(this.base);
  }

  get(id: string): Observable<DiagramDto> {
    return this.http.get<DiagramDto>(`${this.base}/${id}`);
  }

  create(name: string, contentJson: string): Observable<DiagramDto> {
    return this.http.post<DiagramDto>(this.base, { name, contentJson });
  }

  update(id: string, name: string, contentJson: string): Observable<DiagramDto> {
    return this.http.put<DiagramDto>(`${this.base}/${id}`, { name, contentJson });
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
