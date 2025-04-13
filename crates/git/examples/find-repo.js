// Пример для демонстрации работы с функцией findRepository
const { findRepository } = require('..');
const path = require('path');
const fs = require('fs');

// Форматирование временной метки в читаемую дату
function formatDate(timestamp) {
  return new Date(timestamp * 1000).toLocaleString();
}

async function runExample() {
  try {
    console.log('Пример поиска и работы с ближайшим Git репозиторием');
    console.log('---------------------------------------------------------');
    
    // Текущая директория, где запущен скрипт
    const currentDir = process.cwd();
    console.log(`Ищем репозиторий начиная с: ${currentDir}`);
    
    // Используем новую функцию findRepository для поиска ближайшего репозитория
    const repo = findRepository(currentDir);
    console.log('Репозиторий найден!');
    
    // Получаем базовую информацию о репозитории
    try {
      const headCommit = repo.getHeadCommitHash();
      console.log(`HEAD коммит: ${headCommit}`);
    } catch (err) {
      console.log('Не удалось получить HEAD коммит:', err.message);
    }
    
    try {
      const branch = repo.getCurrentBranch();
      console.log(`Текущая ветка: ${branch}`);
    } catch (err) {
      console.log('Не удалось получить текущую ветку:', err.message);
    }
    
    // Получаем список файлов в репозитории
    console.log('\nФайлы в репозитории:');
    const files = repo.listFilesWithMetadata(null);
    console.log(`Найдено ${files.length} файлов, не считая директории .git`);
    
    // Выбираем 3 случайных файла для отображения их метаданных
    console.log('\nМетаданные для нескольких файлов:');
    
    const filesToShow = files
      .filter(f => !f.path.startsWith('.git/'))
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);
    
    filesToShow.forEach(file => {
      console.log(`\nФайл: ${file.path}`);
      console.log(`Последний коммит: ${file.lastCommitHash}`);
      console.log(`Сообщение: ${file.lastCommitMessage.split('\n')[0]}`);
      console.log(`Автор: ${file.lastAuthorName} <${file.lastAuthorEmail}>`);
      console.log(`Дата: ${formatDate(file.lastCommitTime)}`);
      console.log(`Изменения: +${file.addedLines}, -${file.deletedLines}`);
    });
    
    console.log('\nПример успешно завершен!');
    
  } catch (error) {
    console.error('Ошибка:', error.message);
  }
}

runExample(); 