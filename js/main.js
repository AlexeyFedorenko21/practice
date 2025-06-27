class Bot {
    static instance = null;

    // Состояние бота
    #isActive = false; // Запустил ли пользователь
    #userName = ""; // Имя пользователя

    // Храним html-элементы
    #htmls;
    
    constructor() {
        if (Bot.instance === null) {
            this.#init();
            Bot.instance = this;
        }
        return Bot.instance;    
    }

    // Инициализация
    #init() {
        // Инициализируем важные html-элементы
        const msgs = document.getElementById("messages");
        const input = document.getElementById("user-input");
        const btn = document.getElementById("send-message");

        // Обрабатываем важные события
        // Ввод текста
        input.addEventListener("input", () => this.#onInput());

        // Клик на кнопку
        btn.addEventListener("click", ()=> this.#onSend());

        // Сохраняем их в экземпляр бота
        this.#htmls = {msgs, input, btn};
    }

    // Текст вводимого сообщения
    #textMsg = "";
    // Команда, которую получил бот
    #cmd = "";

    // Ввод текста
    #onInput() {
        const { input } = this.#htmls;

        // Сохраняем сообщение
        this.#textMsg = input.value.trim();

        // Проверяем состояние поля, что мы печатаем
        this.#isTyping();

        // Проверяем состояние кнопки
        this.#checkBtn();
    }
    
    // Поле облачка, что идет печать
    #typingMsg = null;

    // Определяем состояние облачка
    #isTyping() {
        const isActive = Boolean(this.#textMsg);

        if (this.#typingMsg === null && isActive) { // Поля нет, но начали печатать
            this.#addTyping();
        } else if (this.#typingMsg !== null && !isActive) { // Поле есть, но перестали печатать (удалили текст)
            this.#deleteTyping();
        }
    }

    // Добавить облачко с печатающимся текстом
    #addTyping() {
        this.#typingMsg = this.#createField("typing", "...", true);
    }

    // Убрать облачко с печатающимся текстом
    #deleteTyping() {
        this.#typingMsg.remove();
        this.#typingMsg = null;
    }

    // Проверка состояния кнопки
    #checkBtn() {
        const { btn } = this.#htmls;
        const isActive = Boolean(this.#textMsg);
        btn.classList.toggle("active", isActive);
        btn.disabled = !isActive;
    }

    // Пользователь пишет сообщение
    #onSend() {
        if (!this.#textMsg) return; // Защита от пустого сообщения

        const { input, btn } = this.#htmls;
        input.value = ""; // Очищаем поле ввода
        this.#deleteTyping(); // Удаляем облачко с печатью текста
        this.#cmd = this.#textMsg;
        this.#textMsg = "";
        this.#createField("msgs", this.#cmd, true); // Отправляем сообщение
        this.#checkBtn();
        this.#answer(); // Ответ бота
    }

    // Находится ли бот в режиме рассчета чего-либо
    #isCalc = false; 
    #numbers = [];
    
    // Ответ бота
    #answer() {
        const cmd = this.#cmd;
        let text = this.#isActive ? "Я не понимаю, введите другую команду!" : "Введите команду /start для начала общения" ;

        // Бот считает
        if (this.#isCalc) {
            if (cmd === "+") {
                text = `${this.#numbers[0] + this.#numbers[1]}`;
            } else if (cmd === "-") {
                text = `${this.#numbers[0] - this.#numbers[1]}`;
            } else if (cmd === "/") {
                text = `${this.#numbers[0] / this.#numbers[1]}`;
            } else if (cmd === "*") {
                text = `${this.#numbers[0] * this.#numbers[1]}`;
            } else if (cmd === "/stop") { // Выход из бота
                text = "Всего доброго, если хочешь поговорить пиши /start";
                this.#isActive = false;
            }
            if (text !== "Я не понимаю, введите другую команду!") { // Текст изменился, операция произвелась
                this.#isCalc = false;
                this.#numbers = [];
            }
        } else {
            if (!this.#isActive) {
                if (cmd === "/start") {
                    text = "Привет, меня зовут Чат-бот, а как зовут тебя?";
                    this.#isActive = true;
                }
            } else {
                if (cmd === "/stop") {
                    text = "Всего доброго, если хочешь поговорить пиши /start";
                    this.#isActive = false;
                    this.#userName = "";
                } else if (this.#userName === "" && cmd.startsWith("/name:")) {
                    this.#userName = cmd.replace("/name:", "");
                    text = `Привет, ${this.#userName}, приятно познакомиться. Я умею считать, введи числа которые надо посчитать (используй команду /number: число, число)`;
                } else if (this.#userName !== "" && cmd.startsWith("/number:")) {
                    const numbers = cmd.replace("/number:", "").split(",");
                    if (numbers.length !== 2) {
                        text = "Введено не два числа для расчета, я не понимаю. Используй, пожалуйста, команду /number: число, число";
                    } else {
                        let isCorrect = true;

                        for (let i = 0; i < numbers.length; i++) {
                            const value = Number(numbers[i]);
                            if (Number.isNaN(value)) {
                                isCorrect = false;
                                break;
                            }
                            this.#numbers.push(value);
                        }

                        if (!isCorrect) { // Ввели что-то не числообразное
                            text = "Введены не два числа, используй, пожалуйста, команду /number: число, число"
                            this.#numbers = [];
                        } else { 
                            text = "Введи одно из действий: -, +, *, /";
                            this.#isCalc = true;
                        }
                    }
                }
            }
        }

        this.#createField("msgs", text);
    }

    // Создать поле с сообщением
    #createField(state = "msgs", text, isUser = false) {
        const { msgs } = this.#htmls;

        const msg = document.createElement("div");
        msg.className = `message ${isUser ? "user" : "bot"}`;

        const avatar = document.createElement("img");
        avatar.src = isUser ? "./images/user_avatar.png" : "./images/bot_avatar.png";

        const content  = document.createElement("div");

        if (state === "typing") {
            content.className = "typing";
            content.innerHTML = '<span></span><span></span><span></span>';
        } else {
            content.textContent = this.#improveText(text);
        }

        msg.appendChild(avatar);
        msg.appendChild(content);

        msgs.appendChild(msg);

        // Если надо скроллить, делаем так, чтобы автоматически проскроллилось вниз
        if (msgs.scrollHeight > msgs.offsetHeight) {
            msgs.scrollTop = msgs.offsetHeight - msgs.scrollHeight;
        }
        return msg;
    }

    // Улучшить текст (чтобы разбить длинные слова)
    #improveText(text) {
        const arr = text.split(" ");
        for (let i = 0; i < arr.length; i++) {
            if (arr[i].length < 30) continue;
            let e = 30;
            while (e < arr[i].length) {
                arr[i] = arr[i].slice(0, e) + " " + arr[i].slice(e);
                e += 30;
            }
        }
        return arr.join(" ");
    }
}

// Экземпляр бота
let bot = null;

window.addEventListener("load", ()=> {
    bot = new Bot();
})