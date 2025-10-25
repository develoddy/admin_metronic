import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'firstLetter' })
export class FirstLetterPipe implements PipeTransform {
  transform(value: any): string {
    if (value == null) return '?';           // null o undefined
    const str = String(value);               // convertir cualquier cosa a string
    return str.charAt(0).toUpperCase();
  }
}
