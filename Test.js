const readline = require('readline-sync');

const number = readline.questionInt('Enter a number: ');

(number % 2 === 0) ? console.log(`${number} is even`) : console.log(`${number} is odd`);

(number % 3 === 0) ? console.log(`${number} is divisible by 3`) : (number % 4 === 0) ? console.log(`${number} is divisible by 4`) : console.log(`${number} is not divisible by 3 or 4`);

const firstname = readline.question('Enter your first name: ');
const nickname = readline.question('Enter your nickname: ');

console.log(firstname.length > 0 ? `hello ${firstname}` : `hello ${nickname}`);

console.log(firstname || nickname);
console.log(nickname || firstname);
console.log(Boolean(""));
console.log(Boolean(0));
console.log(Boolean(null));
console.log(Boolean(undefined));
console.log(Boolean(NaN));
console.log(Boolean("false"));
console.log(Boolean("Helo"));
console.log(Boolean("True"));
console.log(Boolean("1"));