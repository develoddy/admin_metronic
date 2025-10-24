import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'firstLetter' })
export class FirstLetterPipe implements PipeTransform {
  transform(value: string): string {
    return value ? value.charAt(0).toUpperCase() : '?';
  }
}
