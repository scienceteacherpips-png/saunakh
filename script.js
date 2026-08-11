// Конфігурація погодинних базових тарифів (до 8 осіб)
const priceTariffs = {
    'pool': { before15: 700, after15: 900, weekend: 900 },
    'pool-sauna': { before15: 1000, after15: 1200, weekend: 1200 },
    'all': { before15: 1200, after15: 1400, weekend: 1400 }
};

// Елементи форми
const serviceSel = document.getElementById('calc-service');
const daySel = document.getElementById('calc-day');
const guestsInp = document.getElementById('calc-guests');
const startSel = document.getElementById('calc-start');
const endSel = document.getElementById('calc-end');
const infoAlert = document.getElementById('calc-info-alert');

const hoursSummaryText = document.getElementById('hours-summary');
const promoBadgeLabel = document.getElementById('promo-applied');
const promoOfferText = document.getElementById('promo-offer');
const totalPriceText = document.getElementById('total-price');

function runSmartCalculation() {
    // Очищення блоку сповіщень та акцій
    infoAlert.style.display = 'none';
    infoAlert.textContent = '';
    promoBadgeLabel.style.display = 'none';
    promoOfferText.style.display = 'none';

    const service = serviceSel.value;
    const isWeekend = daySel.value === 'weekend';
    const guests = parseInt(guestsInp.value) || 1;
    
    let startHour = parseInt(startSel.value);
    let endHour = parseInt(endSel.value);

    // Захист від збігу часу (мінімальний крок 3 години)
    if (endHour <= startHour) {
        endHour = startHour + 3;
        if (endHour > 22) endHour = 22;
        endSel.value = endHour.toString();
    }

    const totalHours = endHour - startHour;
    hoursSummaryText.textContent = `Тривалість оренди: ${totalHours} год`;

    // Валідація ліміту мінімального замовлення (3 години)
    if (totalHours < 3) {
        infoAlert.innerHTML = "⚠️ <strong>Мінімальне замовлення:</strong> тривалість оренди не може бути меншою за 3 години. Будь ласка, оберіть пізніший час виїзду.";
        infoAlert.style.display = 'block';
        totalPriceText.textContent = "0 грн";
        return;
    }

    // Кількість додаткових гостей понад ліміт у 8 осіб
    const extraGuestsCount = guests > 8 ? guests - 8 : 0;
    const extraGuestsHourlyCost = extraGuestsCount * 100;

    let hourlyBasePrices = [];  
    let hourlyTotalPrices = []; 

    const tariff = priceTariffs[service];

    // 1. Погодинне заповнення кошика вартості відпочинку
    for (let h = startHour; h < endHour; h++) {
        let basePriceForThisHour = 0;

        if (isWeekend) {
            basePriceForThisHour = tariff.weekend;
        } else {
            if (h < 15) {
                basePriceForThisHour = tariff.before15;
            } else {
                basePriceForThisHour = tariff.after15;
            }
        }

        hourlyBasePrices.push(basePriceForThisHour);
        hourlyTotalPrices.push(basePriceForThisHour + extraGuestsHourlyCost);
    }

    // 2. Логіка акції "6+1"
    if (totalHours === 6) {
        // Рівно 6 годин — ціну не знижуємо, а рекомендуємо додати безкоштовну 7-му годину
        promoOfferText.style.display = 'inline-block';
    } else if (totalHours >= 7) {
        // Від 7 годин — акція діє, повністю обнуляємо найдешевшу повну годину (база + всі гості = 0 грн)
        promoBadgeLabel.style.display = 'inline-block';
        
        let minBaseCost = Math.min(...hourlyBasePrices);
        let cheapestHourIndex = hourlyBasePrices.indexOf(minBaseCost);
        
        hourlyBasePrices[cheapestHourIndex] = 0;
        hourlyTotalPrices[cheapestHourIndex] = 0;
    }

    // 3. Зчитування типу обраної знижки (Radio button — діє тільки одна)
    const selectedDiscount = document.querySelector('input[name="calc-discount"]:checked').value;
    let appliedDiscountPct = 0;

    if (selectedDiscount === 'birthday') {
        appliedDiscountPct = 10;
    } else if (selectedDiscount === 'stories') {
        appliedDiscountPct = 5;
    }

    // Рахуємо фінальну суму БАЗИ (після акцій), щоб вирахувати відсоток знижки
    let totalBaseSumAfterPromo = hourlyBasePrices.reduce((acc, val) => acc + val, 0);
    const discountAmountValue = totalBaseSumAfterPromo * (appliedDiscountPct / 100);

    // Кінцева ціна: повна вартість годин (разом з людьми, де акційна година = 0 грн) мінус знижка на базу
    const grandTotalResult = hourlyTotalPrices.reduce((acc, val) => acc + val, 0) - discountAmountValue;

    // Спеціальні повідомлення для великих компаній
    if (guests > 8 && appliedDiscountPct > 0) {
        infoAlert.innerHTML = `ℹ️ <strong>Знижка застосована!</strong> Ваша знижка ${appliedDiscountPct}% знизила вартість базового пакета. Доплата за додаткових гостей нарахована окремо (безкоштовна година за акцією 6+1 повністю коштує 0 грн для всіх).`;
        infoAlert.style.display = 'block';
    }

    // Виведення результату
    totalPriceText.textContent = `${Math.round(grandTotalResult)} грн`;
}

// Слухачі подій
const inputElements = [serviceSel, daySel, guestsInp, startSel, endSel];
inputElements.forEach(el => {
    el.addEventListener('change', runSmartCalculation);
    el.addEventListener('input', runSmartCalculation);
});

document.querySelectorAll('input[name="calc-discount"]').forEach(radio => {
    radio.addEventListener('change', runSmartCalculation);
});

// Первинний запуск
runSmartCalculation();
