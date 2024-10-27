import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ListSliderComponent } from './list-slider/list-slider.component';
import { SliderComponent } from './slider.component';

const routes: Routes = [{
  path: '',
  component: SliderComponent,
  children: [
    {
      path: 'list-sliders',
      component: ListSliderComponent
    }
  ]
}];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SliderRoutingModule { }
