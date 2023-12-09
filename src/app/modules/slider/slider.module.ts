import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SliderRoutingModule } from './slider-routing.module';
import { SliderComponent } from './slider.component';
import { AddNewSliderComponent } from './add-new-slider/add-new-slider.component';
import { EditNewSliderComponent } from './edit-new-slider/edit-new-slider.component';
import { DeleteNewSliderComponent } from './delete-new-slider/delete-new-slider.component';
import { ListSliderComponent } from './list-slider/list-slider.component';


@NgModule({
  declarations: [SliderComponent, AddNewSliderComponent, EditNewSliderComponent, DeleteNewSliderComponent, ListSliderComponent],
  imports: [
    CommonModule,
    SliderRoutingModule
  ]
})
export class SliderModule { }
