let people = [];       // array of strings, e.g. ["Aman", "Riya", "Karan"]
let expenses = [];      // array of { id, description, amount, paidBy, splitBetween: [] }

let nextExpenseId = 1;


const peopleForm = document.getElementById('people-form');
const personNameInput = document.getElementById('person-name');
const peopleList = document.getElementById('people-list');

const expenseForm = document.getElementById('expense-form');
const expenseDescInput = document.getElementById('expense-desc');
const expenseAmountInput = document.getElementById('expense-amount');
const expensePayerSelect = document.getElementById('expense-payer');
const splitCheckboxes = document.getElementById('split-checkboxes');
const expenseList = document.getElementById('expense-list');

const balancesList = document.getElementById('balances-list');
const settleBtn = document.getElementById('settle-btn');
const settlementResult = document.getElementById('settlement-result');



function renderPeople() {
  // Rebuild the chip list of people
  peopleList.innerHTML = '';

  if (people.length === 0) {
    peopleList.innerHTML = '<li class="empty-state">No people added yet.</li>';
  } else {
    people.forEach((name) => {
      const li = document.createElement('li');
      li.innerHTML = `${name} <button data-name="${name}" class="remove-person">&times;</button>`;
      peopleList.appendChild(li);
    });
  }

  
  renderPayerOptions();
  renderSplitCheckboxes();
}

function renderPayerOptions() {
  expensePayerSelect.innerHTML = '';
  people.forEach((name) => {
    const option = document.createElement('option');
    option.value = name;
    option.textContent = name;
    expensePayerSelect.appendChild(option);
  });
}

function renderSplitCheckboxes() {
  splitCheckboxes.innerHTML = '';
  people.forEach((name) => {
    const label = document.createElement('label');
    label.innerHTML = `
      <input type="checkbox" value="${name}" checked />
      ${name}
    `;
    splitCheckboxes.appendChild(label);
  });
}

function renderExpenses() {
  expenseList.innerHTML = '';

  if (expenses.length === 0) {
    expenseList.innerHTML = '<li class="empty-state">No expenses logged yet.</li>';
    return;
  }

  expenses.forEach((exp) => {
    const li = document.createElement('li');
    li.innerHTML = `
      <div>
        <div>${exp.description} — ₹${exp.amount.toFixed(2)}</div>
        <div class="meta">Paid by ${exp.paidBy} · split between ${exp.splitBetween.join(', ')}</div>
      </div>
      <button data-id="${exp.id}" class="remove-expense">&times;</button>
    `;
    expenseList.appendChild(li);
  });
}

function renderBalances() {
  const balances = calculateBalances();
  balancesList.innerHTML = '';

  if (Object.keys(balances).length === 0) {
    balancesList.innerHTML = '<p class="empty-state">Add people and expenses to see balances.</p>';
    return;
  }

  Object.entries(balances).forEach(([name, amount]) => {
    const row = document.createElement('div');
    row.className = 'balance-row';

    let amountClass = 'balance-zero';
    let label = 'settled up';
    if (amount > 0.01) {
      amountClass = 'balance-positive';
      label = `is owed ₹${amount.toFixed(2)}`;
    } else if (amount < -0.01) {
      amountClass = 'balance-negative';
      label = `owes ₹${Math.abs(amount).toFixed(2)}`;
    }

    row.innerHTML = `<span>${name}</span><span class="${amountClass}">${label}</span>`;
    balancesList.appendChild(row);
  });
}



function calculateBalances() {

  const balances = {};
  people.forEach((name) => (balances[name] = 0));

  expenses.forEach((exp) => {
    const splitCount = exp.splitBetween.length;
    if (splitCount === 0) return;

    const share = exp.amount / splitCount;

    
    balances[exp.paidBy] += exp.amount;

    
    exp.splitBetween.forEach((person) => {
      balances[person] -= share;
    });
  });

  return balances;
}



peopleForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = personNameInput.value.trim();
  if (!name || people.includes(name)) return;

  people.push(name);
  personNameInput.value = '';

  renderPeople();
  renderBalances();
});

peopleList.addEventListener('click', (e) => {
  if (!e.target.classList.contains('remove-person')) return;
  const name = e.target.dataset.name;

  people = people.filter((p) => p !== name);
  // Also remove any expenses tied to this person to keep data consistent
  expenses = expenses.filter((exp) => exp.paidBy !== name);
  expenses.forEach((exp) => {
    exp.splitBetween = exp.splitBetween.filter((p) => p !== name);
  });

  renderPeople();
  renderExpenses();
  renderBalances();
});

expenseForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const description = expenseDescInput.value.trim();
  const amount = parseFloat(expenseAmountInput.value);
  const paidBy = expensePayerSelect.value;
  const splitBetween = Array.from(
    splitCheckboxes.querySelectorAll('input[type="checkbox"]:checked')
  ).map((cb) => cb.value);

  if (!description || !amount || !paidBy || splitBetween.length === 0) return;

  expenses.push({
    id: nextExpenseId++,
    description,
    amount,
    paidBy,
    splitBetween,
  });

  expenseForm.reset();
  // reset() unchecks checkboxes; re-render so they default back to checked
  renderSplitCheckboxes();

  renderExpenses();
  renderBalances();
});

expenseList.addEventListener('click', (e) => {
  if (!e.target.classList.contains('remove-expense')) return;
  const id = parseInt(e.target.dataset.id, 10);
  expenses = expenses.filter((exp) => exp.id !== id);

  renderExpenses();
  renderBalances();
});

// ============================================
// INITIAL RENDER
// ============================================

renderPeople();
renderExpenses();
renderBalances();
