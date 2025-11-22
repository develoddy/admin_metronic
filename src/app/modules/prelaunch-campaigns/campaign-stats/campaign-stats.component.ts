import { Component, OnInit } from '@angular/core';
import { PrelaunchCampaignsService } from '../services/prelaunch-campaigns.service';

@Component({
  selector: 'app-campaign-stats',
  templateUrl: './campaign-stats.component.html',
  styleUrls: ['./campaign-stats.component.scss']
})
export class CampaignStatsComponent implements OnInit {
  loading = false;

  constructor(private prelaunchService: PrelaunchCampaignsService) {}

  ngOnInit(): void {
    // Placeholder para futuras estadísticas avanzadas
  }
}
