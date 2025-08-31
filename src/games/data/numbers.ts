// Numbers data for multilingual learning
export interface Number {
  value: number;
  name: string;
  nameEs: string;
  symbol: string;
  id: string;
}

export const NUMBERS: Number[] = [
  { value: 0, name: 'Zero', nameEs: 'Cero', symbol: '0', id: 'zero' },
  { value: 1, name: 'One', nameEs: 'Uno', symbol: '1', id: 'one' },
  { value: 2, name: 'Two', nameEs: 'Dos', symbol: '2', id: 'two' },
  { value: 3, name: 'Three', nameEs: 'Tres', symbol: '3', id: 'three' },
  { value: 4, name: 'Four', nameEs: 'Cuatro', symbol: '4', id: 'four' },
  { value: 5, name: 'Five', nameEs: 'Cinco', symbol: '5', id: 'five' },
  { value: 6, name: 'Six', nameEs: 'Seis', symbol: '6', id: 'six' },
  { value: 7, name: 'Seven', nameEs: 'Siete', symbol: '7', id: 'seven' },
  { value: 8, name: 'Eight', nameEs: 'Ocho', symbol: '8', id: 'eight' },
  { value: 9, name: 'Nine', nameEs: 'Nueve', symbol: '9', id: 'nine' },
  { value: 10, name: 'Ten', nameEs: 'Diez', symbol: '10', id: 'ten' },
  { value: 11, name: 'Eleven', nameEs: 'Once', symbol: '11', id: 'eleven' },
  { value: 12, name: 'Twelve', nameEs: 'Doce', symbol: '12', id: 'twelve' },
  { value: 13, name: 'Thirteen', nameEs: 'Trece', symbol: '13', id: 'thirteen' },
  { value: 14, name: 'Fourteen', nameEs: 'Catorce', symbol: '14', id: 'fourteen' },
  { value: 15, name: 'Fifteen', nameEs: 'Quince', symbol: '15', id: 'fifteen' },
  { value: 16, name: 'Sixteen', nameEs: 'Dieciséis', symbol: '16', id: 'sixteen' },
  { value: 17, name: 'Seventeen', nameEs: 'Diecisiete', symbol: '17', id: 'seventeen' },
  { value: 18, name: 'Eighteen', nameEs: 'Dieciocho', symbol: '18', id: 'eighteen' },
  { value: 19, name: 'Nineteen', nameEs: 'Diecinueve', symbol: '19', id: 'nineteen' },
  { value: 20, name: 'Twenty', nameEs: 'Veinte', symbol: '20', id: 'twenty' },
];

// Age-appropriate number ranges
export const getNumbersForAge = (age: number): Number[] => {
  if (age <= 3) {
    return NUMBERS.slice(0, 4); // 0-3
  } else if (age <= 4) {
    return NUMBERS.slice(0, 6); // 0-5
  } else if (age <= 5) {
    return NUMBERS.slice(0, 11); // 0-10
  } else {
    return NUMBERS.slice(0, 21); // 0-20
  }
};
