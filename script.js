// Структура робочої пам'яті (факти)
let facts = {
    f1: false, // вентиль гарячої води відкритий
    f2: false, // вентиль холодної води відкритий
    f3: false, // вентиль гарячої води повністю відкритий
    f4: false, // вентиль холодної води повністю відкритий
    f5: false, // вода гаряча
    f6: false, // вода холодна
    f7: false, // вода тепла (мета)
    f8: 1      // крок відкриття вентиля
};

// Лічильники для моделювання відкриття вентилів
let hotValveLevel = 0;    // Рівень відкриття гарячої води (0-100)
let coldValveLevel = 0;   // Рівень відкриття холодної води (0-100)
const MAX_LEVEL = 100;

// База продукційних правил
const rules = [
    {
        id: 1,
        p: () => !facts.f4 && !facts.f7,
        a: () => facts.f1 && facts.f5,
        action: 'openColdValve',
        pDescription: '¬f4 ∧ ¬f7',
        aDescription: 'f1 ∧ f5',
        actionDescription: 'ВідкритиВентильХолодноїВодиНа(f8)',
        explanation: 'Вода занадто гаряча. Відкриваємо вентиль холодної води для охолодження.'
    },
    {
        id: 2,
        p: () => !facts.f3 && !facts.f7,
        a: () => facts.f2 && facts.f6,
        action: 'openHotValve',
        pDescription: '¬f3 ∧ ¬f7',
        aDescription: 'f2 ∧ f6',
        actionDescription: 'ВідкритиВентильГарячоїВодиНа(f8)',
        explanation: 'Вода занадто холодна. Відкриваємо вентиль гарячої води для нагрівання.'
    },
    {
        id: 3,
        p: () => facts.f3 && !facts.f7,
        a: () => facts.f1 && facts.f2 && facts.f5,
        action: 'closeHotValve',
        pDescription: 'f3 ∧ ¬f7',
        aDescription: 'f1 ∧ f2 ∧ f5',
        actionDescription: 'ЗакритиВентильГарячоїВоди()',
        explanation: 'Вентиль гарячої води повністю відкритий, але вода все ще гаряча. Закриваємо гарячу воду.'
    },
    {
        id: 4,
        p: () => facts.f4 && !facts.f7,
        a: () => facts.f1 && facts.f2 && facts.f6,
        action: 'closeColdValve',
        pDescription: 'f4 ∧ ¬f7',
        aDescription: 'f1 ∧ f2 ∧ f6',
        actionDescription: 'ЗакритиВентильХолодноїВоди()',
        explanation: 'Вентиль холодної води повністю відкритий, але вода все ще холодна. Закриваємо холодну воду.'
    }
];

// Масиви для протоколів
let protocolLog = [];
let explanationLog = [];

// Ініціалізація при завантаженні сторінки
window.onload = function() {
    updateFacts();
};

// Оновлення відображення фактів
function updateFacts() {
    for (let i = 1; i <= 7; i++) {
        const checkbox = document.getElementById('f' + i);
        const status = document.getElementById('status-f' + i);
        if (checkbox && status) {
            facts['f' + i] = checkbox.checked;
            status.textContent = checkbox.checked ? 'true' : 'false';
            status.className = 'status ' + (checkbox.checked ? 'true' : 'false');
            if (i === 7) status.className += ' goal';
        }
    }

    const f8Input = document.getElementById('f8');
    if (f8Input) {
        facts.f8 = parseInt(f8Input.value) || 1;
    }
}

// Синхронізація фактів з інтерфейсом
function syncFactsToUI() {
    for (let i = 1; i <= 7; i++) {
        const checkbox = document.getElementById('f' + i);
        const status = document.getElementById('status-f' + i);
        if (checkbox && status) {
            checkbox.checked = facts['f' + i];
            status.textContent = facts['f' + i] ? 'true' : 'false';
            status.className = 'status ' + (facts['f' + i] ? 'true' : 'false');
            if (i === 7) status.className += ' goal';
        }
    }

    const f8Input = document.getElementById('f8');
    if (f8Input) {
        f8Input.value = facts.f8;
    }
}

// Дії продукційних правил
function openColdValve() {
    const oldFacts = { ...facts };

    facts.f2 = true;  // Відкриваємо вентиль холодної води
    coldValveLevel += facts.f8 * 10;

    if (coldValveLevel >= MAX_LEVEL) {
        coldValveLevel = MAX_LEVEL;
        facts.f4 = true;  // Повністю відкритий
    }

    updateTemperature();

    return {
        action: 'ВідкритиВентильХолодноїВодиНа(' + facts.f8 + ')',
        changes: getFactChanges(oldFacts, facts)
    };
}

function openHotValve() {
    const oldFacts = { ...facts };

    facts.f1 = true;  // Відкриваємо вентиль гарячої води
    hotValveLevel += facts.f8 * 10;

    if (hotValveLevel >= MAX_LEVEL) {
        hotValveLevel = MAX_LEVEL;
        facts.f3 = true;  // Повністю відкритий
    }

    updateTemperature();

    return {
        action: 'ВідкритиВентильГарячоїВодиНа(' + facts.f8 + ')',
        changes: getFactChanges(oldFacts, facts)
    };
}

function closeHotValve() {
    const oldFacts = { ...facts };

    facts.f1 = false;
    facts.f3 = false;
    hotValveLevel = 0;

    updateTemperature();

    return {
        action: 'ЗакритиВентильГарячоїВоди()',
        changes: getFactChanges(oldFacts, facts)
    };
}

function closeColdValve() {
    const oldFacts = { ...facts };

    facts.f2 = false;
    facts.f4 = false;
    coldValveLevel = 0;

    updateTemperature();

    return {
        action: 'ЗакритиВентильХолодноїВоди()',
        changes: getFactChanges(oldFacts, facts)
    };
}

// Оновлення температури води на основі рівнів вентилів
function updateTemperature() {
    const totalLevel = hotValveLevel + coldValveLevel;

    if (totalLevel === 0) {
        facts.f5 = false;
        facts.f6 = false;
        facts.f7 = false;
        return;
    }

    const hotRatio = hotValveLevel / totalLevel;

    // Моделюємо температуру:
    // - якщо більше 70% гарячої - гаряча
    // - якщо менше 30% гарячої - холодна
    // - інакше - тепла

    if (hotRatio > 0.7) {
        facts.f5 = true;
        facts.f6 = false;
        facts.f7 = false;
    } else if (hotRatio < 0.3) {
        facts.f5 = false;
        facts.f6 = true;
        facts.f7 = false;
    } else if (hotValveLevel > 0 && coldValveLevel > 0) {
        facts.f5 = false;
        facts.f6 = false;
        facts.f7 = true;
    }
}

// Порівняння фактів для виявлення змін
function getFactChanges(oldFacts, newFacts) {
    const changes = [];
    for (let key in oldFacts) {
        if (oldFacts[key] !== newFacts[key]) {
            changes.push(`${key}: ${oldFacts[key]} → ${newFacts[key]}`);
        }
    }
    return changes;
}

// Виконання дії за назвою
function executeAction(actionName) {
    switch (actionName) {
        case 'openColdValve':
            return openColdValve();
        case 'openHotValve':
            return openHotValve();
        case 'closeHotValve':
            return closeHotValve();
        case 'closeColdValve':
            return closeColdValve();
        default:
            return { action: 'Невідома дія', changes: [] };
    }
}

// Головний алгоритм логічного виводу
function runAlgorithm() {
    // Отримуємо поточні значення з інтерфейсу
    updateFacts();

    // Очищуємо протоколи
    protocolLog = [];
    explanationLog = [];

    // Додаємо початковий стан
    addToProtocol('=== ПОЧАТОК РОБОТИ АЛГОРИТМУ ===', 'step');
    addToProtocol('Початковий стан фактів: ' + JSON.stringify(facts, null, 2), 'step');

    addToExplanation('Розпочинаємо роботу експертної системи для налаштування температури води.', 'step');
    addToExplanation('Мета: досягти теплої води (f7 = true).', 'step');

    const MAX_ITERATIONS = 20;  // Обмеження для запобігання нескінченному циклу
    let iteration = 0;
    let ruleExecuted = true;

    while (ruleExecuted && iteration < MAX_ITERATIONS) {
        iteration++;
        ruleExecuted = false;

        addToProtocol(`\n--- Ітерація ${iteration} ---`, 'step');

        // Перевірка цільового стану
        if (facts.f7) {
            addToProtocol('✓ Досягнуто цільовий стан: f7 = true (вода тепла)', 'success');
            addToExplanation('✓ Успіх! Система досягла цільового стану: вода тепла.', 'success');
            break;
        }

        // Перевіряємо правила у порядку 1 → 4
        for (let rule of rules) {
            const pValue = rule.p();
            const aValue = rule.a();

            addToProtocol(
                `Правило ${rule.id}: P = ${pValue}, A = ${aValue}`,
                'step'
            );
            addToProtocol(
                `  P: ${rule.pDescription} = ${pValue}`,
                'step'
            );
            addToProtocol(
                `  A: ${rule.aDescription} = ${aValue}`,
                'step'
            );

            if (pValue && aValue) {
                // Правило спрацювало
                addToProtocol(`✓ Правило ${rule.id} АКТИВОВАНЕ`, 'success');
                addToExplanation(
                    `Крок ${iteration}. Активовано правило ${rule.id}. ${rule.explanation}`,
                    'step'
                );

                // Виконуємо дію
                const result = executeAction(rule.action);

                addToProtocol(`  Дія: ${result.action}`, 'step');
                if (result.changes.length > 0) {
                    addToProtocol(`  Зміни фактів: ${result.changes.join(', ')}`, 'step');
                    addToExplanation(`  Змінено: ${result.changes.join(', ')}`, 'step');
                }

                // Синхронізуємо інтерфейс
                syncFactsToUI();

                ruleExecuted = true;

                // Повертаємося на початок (переривання циклу for, while продовжиться)
                break;
            }
        }

        if (!ruleExecuted) {
            addToProtocol('✗ Жодне правило не активоване на цій ітерації', 'warning');

            if (!facts.f7) {
                addToExplanation(
                    '✗ Система не може більше змінити стан: немає активних правил, але вода не стала теплою.',
                    'error'
                );
            }
        }
    }

    if (iteration >= MAX_ITERATIONS) {
        addToProtocol('⚠ Досягнуто максимальну кількість ітерацій', 'warning');
        addToExplanation('⚠ Алгоритм завершено після максимальної кількості кроків.', 'warning');
    }

    addToProtocol('\n=== КІНЕЦЬ РОБОТИ АЛГОРИТМУ ===', 'step');
    addToProtocol(`Фінальний стан фактів: ${JSON.stringify(facts, null, 2)}`, 'step');
    addToProtocol(`Загальна кількість ітерацій: ${iteration}`, 'step');

    // Відображаємо протоколи
    displayProtocol();
    displayExplanations();
}

// Додавання запису до протоколу
function addToProtocol(message, type = 'step') {
    protocolLog.push({ message, type });
}

// Додавання пояснення
function addToExplanation(message, type = 'step') {
    explanationLog.push({ message, type });
}

// Відображення протоколу
function displayProtocol() {
    const protocolDiv = document.getElementById('protocol');
    protocolDiv.innerHTML = '';

    protocolLog.forEach(entry => {
        const logEntry = document.createElement('div');
        logEntry.className = 'log-entry ' + entry.type;
        logEntry.textContent = entry.message;
        protocolDiv.appendChild(logEntry);
    });

    // Прокрутка вниз
    protocolDiv.scrollTop = protocolDiv.scrollHeight;
}

// Відображення пояснень
function displayExplanations() {
    const explanationsDiv = document.getElementById('explanations');
    explanationsDiv.innerHTML = '';

    explanationLog.forEach(entry => {
        const logEntry = document.createElement('div');
        logEntry.className = 'log-entry ' + entry.type;
        logEntry.textContent = entry.message;
        explanationsDiv.appendChild(logEntry);
    });

    // Прокрутка вниз
    explanationsDiv.scrollTop = explanationsDiv.scrollHeight;
}

// Очищення протоколів
function clearProtocol() {
    protocolLog = [];
    explanationLog = [];

    document.getElementById('protocol').innerHTML = '';
    document.getElementById('explanations').innerHTML = '';
}

// Скидання до початкових значень
function resetFacts() {
    facts = {
        f1: false,
        f2: false,
        f3: false,
        f4: false,
        f5: false,
        f6: false,
        f7: false,
        f8: 1
    };

    hotValveLevel = 0;
    coldValveLevel = 0;

    syncFactsToUI();
    clearProtocol();
}

// Друк результатів
function printResults() {
    window.print();
}
