// Пример для демонстрации расширенных возможностей модуля git
const { cloneRepository } = require('..');
const path = require('path');
const fs = require('fs');

// Helper to clean directory
function cleanDir(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
  fs.mkdirSync(dir, { recursive: true });
}

// Format timestamp to readable date
function formatDate(timestamp) {
  return new Date(timestamp * 1000).toLocaleString();
}

async function runExample() {
  try {
    // URL репозитория для клонирования
    const repositoryUrl = 'https://github.com/femboypig/test';
    const clonePath = path.join(__dirname, 'history-repo');
    
    // Очищаем директорию назначения
    cleanDir(clonePath);
    
    console.log(`Клонирование репозитория: ${repositoryUrl}`);
    console.log(`В директорию: ${clonePath}`);
    
    // Клонируем репозиторий
    const repo = cloneRepository(repositoryUrl, clonePath);
    console.log('\nРепозиторий успешно клонирован');
    
    // Получаем список всех файлов с метаданными
    console.log('\n===== Список файлов с метаданными =====');
    const filesWithMetadata = repo.listFilesWithMetadata(null);
    console.log(`Найдено ${filesWithMetadata.length} файлов:\n`);
    
    // Выводим краткую информацию о каждом файле
    filesWithMetadata.forEach(file => {
      if (!file.lastCommitHash) {
        console.log(`${file.path} - новый файл, не коммичен`);
      } else {
        console.log(`${file.path} - последний коммит: ${file.lastCommitHash.substr(0, 8)}, автор: ${file.lastAuthorName}`);
      }
    });
    
    // Выбираем все файлы для подробного анализа истории (кроме .git)
    const targetFiles = filesWithMetadata.filter(f => !f.path.startsWith('.git/') && f.lastCommitHash);
    
    console.log(`\n===== Подробная история файлов (${targetFiles.length}) =====`);
    
    // Анализируем историю для каждого файла
    for (const file of targetFiles) {
      console.log(`\n----- Файл: ${file.path} -----`);
      
      // Получаем полную историю файла
      const fileHistory = repo.getFileHistory(file.path);
      console.log(`Найдено ${fileHistory.length} коммитов для этого файла:`);
      
      // Выводим полную историю изменений файла
      fileHistory.forEach((commit, index) => {
        console.log(`[${index + 1}] Коммит: ${commit.commitHash.substr(0, 8)}`);
        console.log(`    Дата: ${formatDate(commit.commitTime)}`);
        console.log(`    Автор: ${commit.authorName} <${commit.authorEmail}>`);
        console.log(`    Изменения: +${commit.addedLines} строк, -${commit.deletedLines} строк`);
        
        // Показываем только первую строку сообщения коммита
        const firstLine = commit.commitMessage.split('\n')[0];
        console.log(`    Сообщение: ${firstLine}`);
      });
    }
    
    // Создаем новый тег для последнего коммита
    console.log('\n===== Работа с тегами =====');
    
    // Получаем существующие теги
    const existingTags = repo.listTags();
    console.log(`Существующие теги (${existingTags.length}):`);
    existingTags.forEach(tag => {
      console.log(`  - ${tag.name} - указывает на ${tag.targetCommit.substr(0, 8)}`);
      if (tag.message) {
        console.log(`    Сообщение: ${tag.message.split('\n')[0]}`);
      }
    });
    
    // Создаем новый тег
    const newTagName = `example-tag-${Date.now()}`;
    console.log(`\nСоздание нового тега: ${newTagName}`);
    
    const tagId = repo.createTag(
      newTagName, 
      "Это тестовый тег, созданный примером", 
      null // Используем текущий HEAD
    );
    
    console.log(`Тег создан с ID: ${tagId}`);
    
    // Получаем обновленный список тегов
    const updatedTags = repo.listTags();
    console.log(`\nОбновленный список тегов (${updatedTags.length}):`);
    updatedTags.forEach(tag => {
      console.log(`  - ${tag.name} - создан: ${formatDate(tag.tagTime)}`);
    });
    
    // Удаляем созданный тег
    console.log(`\nУдаление тега: ${newTagName}`);
    repo.deleteTag(newTagName);
    
    // Проверяем, что тег удален
    const finalTags = repo.listTags();
    console.log(`Финальный список тегов (${finalTags.length})`);
    
    console.log('\nПример успешно завершен!');
    
  } catch (error) {
    console.error('Ошибка:', error);
  }
}

runExample(); 