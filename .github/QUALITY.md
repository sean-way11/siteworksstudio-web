# Проверки SiteWorksStudio

Сайт остаётся статическим HTML/CSS/JS. Astro в репозитории нет: обновление
Astro 7.4.13 к нему неприменимо, миграция фреймворка не нужна.

## Перед публикацией

```sh
npm ci --ignore-scripts
npx playwright install --with-deps chromium
npm test
```

На Windows, если `npm.ps1` заблокирован политикой PowerShell, используйте
`npm.cmd` и `npx.cmd`. Для локального запуска требуется Python 3, доступный
командой `python3` (в Windows можно использовать WSL).

Workflow `Website quality` запускается для pull request и изменений main:

- проверяет локальные ссылки, ресурсы, синтаксис JavaScript и sitemap;
- сохраняет проверку идентификаторов повторных заявок;
- открывает все HTML-страницы при ширинах 390 и 1280 px;
- проверяет переполнение, основные изображения, меню на 390/1179/1180 px,
  Enter/Escape и возврат фокуса, режим reduced motion;
- проверяет валидацию брифа, ошибку отправки, повтор и изменённую заявку;
- сканирует всю Git-историю бесплатным Gitleaks CLI 8.30.1, с маскировкой секретов.

Все POST-запросы блокируются до отправки. Ответы обработчика заявки
подменяются; синтетические данные используют домен `example.invalid`.
Тест не подтверждает доставку в OS/Telegram и не создаёт настоящие заказы.
Локальные отчёты находятся в `.qa-artifacts/`, в Git они не попадают.

## Cloudflare Browser Run

Тот же браузерный сценарий запускается без развёртывания Worker:

```sh
npm run test:cloud
```

Нужны защищённые переменные `CLOUDFLARE_ACCOUNT_ID` и
`CLOUDFLARE_API_TOKEN` с разрешением Browser Run Edit только на нужный аккаунт.
Не записывайте значения в репозиторий или сообщения. В GitHub Actions их
нужно сохранить как secrets с этими именами, затем вручную запустить
`Website quality` с опцией `cloud=true`. Без переменных команда завершится
ошибкой, а не выдаст ложный успешный результат.

По умолчанию облачный сценарий проверяет 6 основных страниц на двух ширинах,
затем меню, reduced motion и бриф. После `/script` сессия явно закрывается;
резервный idle timeout — 10 секунд. `/snapshot` одним запросом возвращает
PDF главной, ссылки и заголовок. Workers AI не используется.

Бесплатный лимит, проверенный 23.11.2026: 10 браузерных минут в день,
до 3 одновременных браузеров. Автоматического включения платного тарифа нет.
Облачная проверка выполняется только по ручному запуску, чтобы не расходовать
общую квоту при каждом коммите.

Источники:
- https://developers.cloudflare.com/browser-run/script/
- https://developers.cloudflare.com/browser-run/pricing/
- https://developers.cloudflare.com/changelog/post/2026-11-19-snapshot-all-formats/
- https://playwright.dev/docs/api/class-browsercontext#browser-context-route

## GitHub Event Streams

```sh
npm run watch:pr -- https://github.com/sean-way11/siteworksstudio-web/pull/NUMBER
```

Нужны GitHub CLI >= 2.105.0, его авторизация и одобрение доступа к preview
Event Streams. Эта возможность пока не общедоступна; один только новый
скрипт не включает её на аккаунте. Команда ожидает одно событие до 5 минут,
не создаёт бесконечный polling и не выполняет merge/deploy.
Существующее состояние проверок нужно читать отдельно: поток сообщает
только о событиях после подключения. Тайм-аут возвращает код 8.

Источники:
- https://github.blog/changelog/2026-11-18-wait-for-pull-request-events-with-github-cli/
- https://cli.github.com/manual/gh_event_listen

## Поиск секретов

Gitleaks заменяет платную проверку Copilot для этой задачи. Copilot Secret
Scanning не включён: он расходует AI-кредиты. Сканирование Gitleaks не
гарантирует обнаружение любого возможного секрета и не заменяет отзыв
действительно утёкших ключей.

Источник: https://github.com/gitleaks/gitleaks/tree/v8.30.1
