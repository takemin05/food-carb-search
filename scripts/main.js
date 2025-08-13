const searchInput = document.getElementById('food-search');
const resultDisplay = document.getElementById('result');
const submitButton = document.getElementById('submit');
const searchForm = document.getElementById('search-form');
const listFoodBtn = document.getElementById('list-food-btn');
const foodTableArea = document.getElementById('food-table-area');

// JSONとlocalStorageから食品データを取得
async function fetchFoodData() {
    const response = await fetch('./data/foods.json');
    const foods = await response.json();
    const userFoods = JSON.parse(localStorage.getItem('userFoods') || '[]');
    return [...foods, ...userFoods];
}

// 検索処理（部分一致）
async function searchFood() {
    const foodName = searchInput.value.trim().toLowerCase();
    if (!foodName) {
        resultDisplay.textContent = '';
        return;
    }
    const foods = await fetchFoodData();
    const matched = foods.filter(food => food.name.toLowerCase().includes(foodName));
    if (matched.length > 0) {
        resultDisplay.innerHTML = matched.map(food => {
            const carbs = (food.carbs === undefined || food.carbs === null || food.carbs === "") ? "未定義です" : `${food.carbs}g`;
            const unit = food.unit ? food.unit : "";
            return `<div>${food.name}：糖質量 ${carbs} ${unit ? `(${unit})` : ""}</div>`;
        }).join('');
    } else {
        resultDisplay.innerHTML = `
            <div>食品が見つかりませんでした。</div>
            <div style="color:#e53935; font-size:0.95em; margin-top:0.5em;">
                名前が間違っていないか、ひらがなやカタカナ、漢字等に変換してもう一度試してください
            </div>
        `;
    }
}

// ボタン押下時
submitButton.addEventListener('click', (event) => {
    event.preventDefault();
    searchFood();
});

// Enterキー対応
searchForm.addEventListener('submit', (event) => {
    event.preventDefault();
    searchFood();
});

// 一覧ボタンでテーブル表示
listFoodBtn.addEventListener('click', () => {
    renderFoodTable();
});

// テーブル表示・編集・削除・追加
function renderFoodTable() {
    foodTableArea.innerHTML = "";
    fetchFoodData().then(foods => {
        let userFoods = JSON.parse(localStorage.getItem('userFoods') || '[]');
        let html = `<table class="food-table"><thead><tr>
            <th></th><th>食品名</th><th>糖質量(g)</th><th>単位</th>
        </tr></thead><tbody>`;
        foods.forEach((food, idx) => {
            const isUser = idx >= foods.length - userFoods.length;
            html += `<tr>
                <td>${isUser ? `<button class="minus-btn" data-idx="${idx}">－</button>` : ""}</td>
                <td><input value="${food.name}" data-idx="${idx}" data-field="name" ${isUser ? "" : "readonly"}/></td>
                <td><input type="number" value="${food.carbs}" data-idx="${idx}" data-field="carbs" ${isUser ? "" : "readonly"}/></td>
                <td><input value="${food.unit || ""}" data-idx="${idx}" data-field="unit" ${isUser ? "" : "readonly"}/></td>
            </tr>`;
        });
        // 追加行
        html += `<tr>
            <td></td>
            <td><input id="add-name" placeholder="食品名"></td>
            <td><input id="add-carbs" type="number" placeholder="糖質量(g)" min="0"></td>
            <td><input id="add-unit" placeholder="例: 100gあたり"></td>
        </tr>`;
        html += `</tbody></table>
            <div class="food-table-buttons">
                <button class="add-row-btn" id="add-row-btn">追加</button>
                <button class="done-btn" id="done-btn">完了</button>
            </div>`;
        foodTableArea.innerHTML = html;

        // 削除
        document.querySelectorAll('.minus-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const idx = Number(e.target.dataset.idx);
                let foods = await fetchFoodData();
                let userFoods = JSON.parse(localStorage.getItem('userFoods') || '[]');
                if (idx >= foods.length - userFoods.length) {
                    userFoods.splice(idx - (foods.length - userFoods.length), 1);
                    localStorage.setItem('userFoods', JSON.stringify(userFoods));
                    renderFoodTable();
                } else {
                    alert("初期データは削除できません");
                }
            });
        });

        // 編集
        document.querySelectorAll('.food-table input').forEach(input => {
            input.addEventListener('change', async (e) => {
                const idx = Number(e.target.dataset.idx);
                const field = e.target.dataset.field;
                let foods = await fetchFoodData();
                let userFoods = JSON.parse(localStorage.getItem('userFoods') || '[]');
                if (idx >= foods.length - userFoods.length) {
                    userFoods[idx - (foods.length - userFoods.length)][field] = field === "carbs" ? Number(e.target.value) : e.target.value;
                    localStorage.setItem('userFoods', JSON.stringify(userFoods));
                } else {
                    e.target.value = foods[idx][field]; // 初期データは編集不可
                    alert("初期データは編集できません");
                }
            });
        });

        // 追加
        document.getElementById('add-row-btn').addEventListener('click', () => {
            const name = document.getElementById('add-name').value.trim();
            const carbs = document.getElementById('add-carbs').value.trim();
            const unit = document.getElementById('add-unit').value.trim();
            if (!name || !carbs) {
                alert('食品名と糖質量は必須です');
                return;
            }
            let userFoods = JSON.parse(localStorage.getItem('userFoods') || '[]');
            userFoods.push({ name, carbs: Number(carbs), unit });
            localStorage.setItem('userFoods', JSON.stringify(userFoods));
            renderFoodTable();
        });

        // 完了
        document.getElementById('done-btn').addEventListener('click', () => {
            foodTableArea.innerHTML = "";
        });
    });
}