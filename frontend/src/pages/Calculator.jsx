import { useState, useEffect } from 'react';
import { api } from '../api';

export default function Calculator() {
  const [categories, setCategories] = useState([]);
  const [rates, setRates] = useState({});
  const [form, setForm] = useState({
    category: 'Другое',
    invoice_value: '',
    weight_kg: '',
    quantity: '1',
    currency_rate: '95.0',
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.getCalcCategories().then(data => {
      setCategories(data.categories);
      setRates(data.rates);
      setForm(f => ({ ...f, category: data.categories[0] || 'Другое' }));
    }).catch(console.error);
  }, []);

  const handleCalc = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.calculate({
        category: form.category,
        invoice_value: parseFloat(form.invoice_value) || 0,
        weight_kg: parseFloat(form.weight_kg) || 0,
        quantity: parseInt(form.quantity) || 1,
        currency_rate: parseFloat(form.currency_rate) || 95,
      });
      setResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const currentRate = rates[form.category] || {};

  return (
    <div className="section" style={{ maxWidth: '900px', margin: '0 auto' }}>
      <h1 className="section-title" style={{ marginBottom: '8px' }}>Калькулятор таможенных пошлин</h1>
      <p className="section-subtitle">Рассчитайте стоимость растаможки товаров из Китая</p>

      <div className="calc-layout">
        <form onSubmit={handleCalc} className="calc-form">
          <div className="form-group">
            <label>Категория товара</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {currentRate.duty !== undefined && (
            <div className="calc-rate-info">
              <span>Пошлина: {currentRate.duty}%</span>
              <span>НДС: {currentRate.vat}%</span>
            </div>
          )}

          <div className="form-group">
            <label>Стоимость по инвойсу (USD)</label>
            <input
              type="number"
              placeholder="10000"
              value={form.invoice_value}
              onChange={(e) => setForm({ ...form, invoice_value: e.target.value })}
              min="0"
              step="0.01"
              required
            />
          </div>

          <div className="form-group">
            <label>Вес брутто (кг)</label>
            <input
              type="number"
              placeholder="500"
              value={form.weight_kg}
              onChange={(e) => setForm({ ...form, weight_kg: e.target.value })}
              min="0"
              step="0.1"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Кол-во единиц</label>
              <input
                type="number"
                placeholder="100"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                min="1"
              />
            </div>
            <div className="form-group">
              <label>Курс USD/RUB</label>
              <input
                type="number"
                placeholder="95.0"
                value={form.currency_rate}
                onChange={(e) => setForm({ ...form, currency_rate: e.target.value })}
                min="0"
                step="0.01"
              />
            </div>
          </div>

          <button type="submit" className="btn btn-accent btn-lg btn-block" disabled={loading}>
            {loading ? 'Считаем...' : 'Рассчитать'}
          </button>
        </form>

        {result && (
          <div className="calc-result">
            <h3>Результат расчёта</h3>
            <div className="calc-result-grid">
              <div className="calc-item">
                <span className="calc-label">Стоимость в ₽</span>
                <span className="calc-value">{result.invoice_value_rub.toLocaleString('ru-RU')} ₽</span>
              </div>
              <div className="calc-item">
                <span className="calc-label">Таможенная пошлина ({result.duty_rate}%)</span>
                <span className="calc-value">{result.customs_duty.toLocaleString('ru-RU')} ₽</span>
              </div>
              <div className="calc-item">
                <span className="calc-label">Таможенный сбор</span>
                <span className="calc-value">{result.customs_fee.toLocaleString('ru-RU')} ₽</span>
              </div>
              <div className="calc-item">
                <span className="calc-label">НДС ({result.vat_rate}%)</span>
                <span className="calc-value">{result.vat.toLocaleString('ru-RU')} ₽</span>
              </div>
              <div className="calc-item calc-total">
                <span className="calc-label">Итого платежей</span>
                <span className="calc-value">{result.total.toLocaleString('ru-RU')} ₽</span>
              </div>
              <div className="calc-item">
                <span className="calc-label">На единицу товара</span>
                <span className="calc-value">{result.per_unit.toLocaleString('ru-RU')} ₽</span>
              </div>
            </div>
            <p className="calc-disclaimer">
              * Расчёт носит ориентировочный характер. Точная сумма зависит от кода ТН ВЭД, 
              страны происхождения и действующих тарифных преференций. 
              Для точного расчёта рекомендуем пройти наш курс «Таможенное оформление: от А до Я».
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
