import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app.component.html'
})
export class AppComponent implements OnInit {
  isConnected = false;
  isLoading = true;
  errorMessage = '';

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.checkBackendConnection();
  }

  checkBackendConnection() {
    this.http.get('/api/health/test')
      .subscribe({
        next: (response: any) => {
          this.isConnected = response.status === 'connected';
          this.isLoading = false;
        },
        error: (error) => {
          this.isConnected = false;
          this.isLoading = false;
          this.errorMessage = 'Failed to connect to backend';
          console.error('Connection error:', error);
        }
      });
  }
}
