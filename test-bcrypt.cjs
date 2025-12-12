const bcrypt = require('bcryptjs');

const password = 'True@2024!';
const hash = '$2b$10$z/YyEYwkBothXxP6V3emcuN6m6X6J2vY3RDxKPfuDsN.OunU4Pabu';

console.log('🔐 Testando validação bcrypt...\n');
console.log('Senha:', password);
console.log('Hash:', hash);
console.log('');

bcrypt.compare(password, hash, (err, result) => {
  if (err) {
    console.error('❌ Erro:', err);
  } else {
    console.log('✅ Resultado:', result);
    if (result) {
      console.log('🎉 SENHA VÁLIDA!');
    } else {
      console.log('❌ SENHA INVÁLIDA!');
    }
  }
});
