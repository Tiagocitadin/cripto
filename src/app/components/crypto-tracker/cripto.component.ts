import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MercadoBitcoinService } from '../../services/mercado-bitcoin';
import { of, Subscription, timer } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';

interface CryptoData {
  buy: string;
  sell: string;
  high?: string;
  low?: string;
  vol?: string;
  last?: string;
  date: number;
  timestamp?: Date; 
}

@Component({
  selector: 'app-cripto',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cripto.component.html',
  styleUrls: ['./cripto.component.css']
})
export class CriptoComponent implements OnInit, OnDestroy {
  // Lista completa de moedas disponíveis
  private todasMoedas: string[] = ['BTC', 'ETH', 'LTC', 'XRP', 'SHIB', 'DOGE', 'MINA', 'RACA'];
  
  // Dados do componente
  moedasFiltradas: string[] = [];
  moedasSelecionadas: string[] = [];
  dados: { [key: string]: CryptoData } = {};
  searchTerm: string = '';
  ultimaAtualizacao?: Date;
  isLoading: boolean = false;
  errorMessage?: string;

  // Gerenciamento de subscriptions
  private dataSubscriptions: { [key: string]: Subscription } = {};
  private globalSubscriptions = new Subscription();

  constructor(private mbService: MercadoBitcoinService) {}

  ngOnInit(): void {
    this.moedasFiltradas = [...this.todasMoedas];
    this.setupAutoRefresh();
  }

  ngOnDestroy(): void {
    // Limpa todas as subscriptions
    Object.values(this.dataSubscriptions).forEach(sub => sub.unsubscribe());
    this.globalSubscriptions.unsubscribe();
  }

  private setupAutoRefresh(): void {
    // Atualiza os dados a cada 30 segundos
    const refreshSub = timer(0, 30000)
      .subscribe(() => this.atualizarDados());
    
    this.globalSubscriptions.add(refreshSub);
  }

  private atualizarDados(): void {
    this.moedasSelecionadas.forEach(moeda => {
      this.fetchCurrencyData(moeda);
    });
    this.ultimaAtualizacao = new Date();
  }

  private fetchCurrencyData(moeda: string): void {
    // Cancela a subscription anterior se existir
    if (this.dataSubscriptions[moeda]) {
      this.dataSubscriptions[moeda].unsubscribe();
    }

    this.isLoading = true;
    this.errorMessage = undefined;

    this.dataSubscriptions[moeda] = this.mbService.getTickerEmTempoReal(moeda)
      .pipe(
        // Adiciona tratamento de erro
        catchError(error => {
          console.error(`Erro ao buscar dados de ${moeda}:`, error);
          this.errorMessage = `Falha ao carregar dados de ${moeda}`;
          return of(null);
        })
      )
      .subscribe({
        next: (data) => {
          if (data) {
            this.dados[moeda] = data.ticker;
            this.dados[moeda].timestamp = new Date(data.ticker.date * 1000);
          }
        },
        complete: () => {
          this.isLoading = false;
        }
      });
  }

  onToggleMoeda(moeda: string, checked: boolean): void {
    if (checked) {
      this.moedasSelecionadas.push(moeda);
      this.fetchCurrencyData(moeda);
    } else {
      this.moedasSelecionadas = this.moedasSelecionadas.filter(m => m !== moeda);
      this.dataSubscriptions[moeda]?.unsubscribe();
      delete this.dataSubscriptions[moeda];
      delete this.dados[moeda];
    }
  }

  filtrarMoedas(): void {
    if (!this.searchTerm) {
      this.moedasFiltradas = [...this.todasMoedas];
      return;
    }
    
    this.moedasFiltradas = this.todasMoedas.filter(moeda =>
      moeda.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  calcularVariacao(moeda: string): number {
    if (!this.dados[moeda]?.high || !this.dados[moeda]?.low) return 0;
    const high = parseFloat(this.dados[moeda].high!);
    const low = parseFloat(this.dados[moeda].low!);
    return ((high - low) / low) * 100;
  }
}