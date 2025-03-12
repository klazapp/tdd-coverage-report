# **TDD Coverage Report**
_A custom Jest reporter for enhanced test coverage visualization in both **console** and **HTML reports**._

📊 **Beautifully formatted console output**  
📄 **Custom HTML test coverage report**  
✅ **Color-coded coverage thresholds**  
🖥️ **Floating UI controls for saving as PDF & expanding test sections**  

---

## **📄 HTML Report Preview**
### 📄 Main Page - Test Coverage Summary  
Shows the overall test coverage percentage and key metrics.  
![Main Page](screenshots/main-page.png)

### ✅ Test Cases - Passed & Failed Tests  
Displays detailed test results with expandable sections.  
![Test Cases](screenshots/test-cases.png)

### 📜 Script Coverage - Line & Branch Analysis  
Highlights uncovered lines and statements for better test coverage improvement.  
![Script Coverage](screenshots/script-coverage.png)

---

## **🚀 Installation**
You can install this package directly from **npm**:

```sh
npm install --save-dev tdd-coverage-report
```

or, install directly from **GitHub**:

```sh
npm install --save-dev github:klazapp/tdd-coverage-report
```

---

## **📌 Setup**
To enable the custom reporter in your **Jest configuration**, update `jest.config.js`:

```js
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node", // or "jsdom"
  collectCoverage: true,
  coverageReporters: ["json", "lcov", "clover"],
  coverageDirectory: "./coverage",
  testMatch: ["**/__tests__/**/*.test.ts"], // Adjust this based on your test files

  reporters: [
    "default",
    [
      "tdd-coverage-report",
      {
        coverageTarget: {
          statements: 80,
          branches: 75,
          functions: 85,
          lines: 80,
          total: 80, // Global threshold
        },
        reportTitle: "Custom Test Coverage Report",
        enableDetailedLog: true,
      },
    ],
  ],
};
```

🔹 **The `coverageTarget` options allow you to specify custom coverage thresholds.**  
🔹 **These values will be used for color-coding the console and marking targets in the HTML report.**  

---

## **🛠️ Usage**
Run Jest with the custom reporter:

```sh
npm test
```

or

```sh
npx jest --coverage
```

Once the tests complete, your **custom HTML report** will be generated in the **project root**:

```
📄 tdd-coverage-report.html
```

---

## **📊 Features**
✅ **Custom Console Table**  
- Color-coded pass/fail coverage results in the terminal  
- Nicely formatted two-line table layout  
- Auto-wraps long file names  

✅ **Custom HTML Coverage Report**  
- **Visual test summaries** with expandable test cases  
- **Full script coverage details**, highlighting uncovered lines  
- **Clickable floating UI controls** for exporting as PDF  

✅ **Dynamic Coverage Targets**  
- Uses **default thresholds** unless overridden via Jest config  
- Applies **red/yellow/green** coloring based on these thresholds  

---

## **🎨 Console Output Example**
```
📊 File-Level Coverage 

 File Name                      | Statements      | Branches      | Functions      | Lines         
--------------------------------|-----------------|---------------|----------------|--------------
 src/utils/calc.ts              | 100.00% (10/10) | 75.00% (3/4)  | 100.00% (5/5)  | 90.00% (9/10)  
 src/utils/calc.ts (continued)  |                 |               |                |              
 src/api/index.ts               | 85.00% (17/20)  | 90.00% (9/10) | 95.00% (19/20) | 88.00% (22/25)  
 src/api/index.ts (continued)   |                 |               |                |              
```

✅ **Green** = Meets or exceeds coverage target  
⚠️ **Yellow** = Almost meeting the threshold  
❌ **Red** = Below the threshold  

---

## **📄 HTML Report Preview**
When the tests finish, open the **generated HTML report**:

```sh
open tdd-coverage-report.html
```

or manually open it in your browser.

---

## **📜 License**
This project is licensed under the **MIT License**.

---

## **🙌 Contributing**
If you’d like to contribute:
1. Fork the repository
2. Create a new branch (`feature/new-feature`)
3. Commit your changes
4. Push to your branch
5. Open a pull request 🚀

---

## **📞 Support**
For issues or feature requests, [open an issue](https://github.com/klazapp/tdd-coverage-report/issues).







