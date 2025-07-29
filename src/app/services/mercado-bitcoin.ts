import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, timer, of } from 'rxjs';
import { catchError, retry, switchMap, shareReplay, distinctUntilChanged, filter } from 'rxjs/operators';

interface TickerResponse {
  ticker: {
    buy: string;
    sell: string;
    high: string;
    low: string;
    vol: string;
    last: string;
    date: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class MercadoBitcoinService {
  private readonly API_URL = 'https://www.mercadobitcoin.net/api';
  private readonly CACHE_SIZE = 1;
  private readonly RETRY_COUNT = 3;
  private readonly RETRY_DELAY = 2000;
  private readonly REFRESH_INTERVAL = 30000;

  // Cache para armazenar as últimas respostas
  private cache: { [key: string]: Observable<TickerResponse> } = {};

  constructor(private http: HttpClient) {}

  /**
   * Obtém os dados do ticker para uma moeda específica
   * @param moeda Sigla da moeda (ex: BTC, ETH)
   * @param useCache Se deve usar cache (padrão: true)
   */
  getTicker(moeda: string, useCache: boolean = true): Observable<TickerResponse> {
    if (!moeda) {
      throw new Error('O parâmetro moeda é obrigatório');
    }

    const url = `${this.API_URL}/${moeda.toUpperCase()}/ticker`;

    if (!useCache || !this.cache[moeda]) {
      this.cache[moeda] = this.http.get<TickerResponse>(url).pipe(
        retry(this.RETRY_COUNT),
        catchError(this.handleError),
        shareReplay(this.CACHE_SIZE)
      );
    }

    return this.cache[moeda];
  }

  /**
   * Obtém os dados do ticker em tempo real com intervalo definido
   * @param moeda Sigla da moeda
   * @param intervalMs Intervalo de atualização em milissegundos (opcional)
   */
  getTickerEmTempoReal(moeda: string, intervalMs: number = this.REFRESH_INTERVAL): Observable<TickerResponse> {
    return timer(0, intervalMs).pipe(
      switchMap(() => this.getTicker(moeda, false)),
      distinctUntilChanged((prev, curr) => 
        prev.ticker.date === curr.ticker.date
      ),
      filter(data => !!data.ticker),
      catchError(this.handleError)
    );
  }

  /**
   * Tratamento de erros centralizado
   */
  private handleError(error: any): Observable<TickerResponse> {
    console.error('Erro na requisição:', error);
    // Retorna um objeto vazio com a estrutura esperada
    return of({
      ticker: {
        buy: '0',
        sell: '0',
        high: '0',
        low: '0',
        vol: '0',
        last: '0',
        date: Date.now() / 1000
      }
    });
  }
}