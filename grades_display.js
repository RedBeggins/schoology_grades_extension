document.addEventListener('DOMContentLoaded', () => {
    const gradesContainer = document.getElementById('gradesContainer');
    const bimesterSelect = document.getElementById('bimester-select');
    const modal = document.getElementById('gradeDetailModal');
    const closeButton = document.querySelector('.close-button');
    const modalTitle = document.getElementById('modalTitle');
    const modalActivityName = document.getElementById('modalActivityName');
    const modalActivityLink = document.getElementById('modalActivityLink'); // New element for clickable link
    const modalCategory = document.getElementById('modalCategory');
    const modalGradeValue = document.getElementById('modalGradeValue');
    const modalSubject = document.getElementById('modalSubject');
    const modalDueDate = document.getElementById('modalDueDate'); // New element
    const modalAverageDetails = document.getElementById('modalAverageDetails');
    const averageCalculationSteps = document.getElementById('averageCalculationSteps');
    const modalFinalAverage = document.getElementById('modalFinalAverage');

    // New tool elements
    const neededGradeCourseSelect = document.getElementById('neededGradeCourseSelect');
    const neededGradeBimesterSelect = document.getElementById('neededGradeBimesterSelect');
    const targetAverageInput = document.getElementById('targetAverageInput');
    const neededGradeCategorySelect = document.getElementById('neededGradeCategorySelect');
    const calculateNeededGradeBtn = document.getElementById('calculateNeededGradeBtn');
    const neededGradeResultDiv = document.getElementById('neededGradeResult');
    const neededGradeOutput = document.getElementById('neededGradeOutput');

    const affectAverageCourseSelect = document.getElementById('affectAverageCourseSelect');
    const affectAverageBimesterSelect = document.getElementById('affectAverageBimesterSelect');
    const newGradeInput = document.getElementById('newGradeInput');
    const newGradeCategorySelect = document.getElementById('newGradeCategorySelect');
    const calculateAffectAverageBtn = document.getElementById('calculateAffectAverageBtn');
    const affectAverageResultDiv = document.getElementById('affectAverageResult');
    const affectAverageOutput = document.getElementById('affectAverageOutput');

    let allGrades = [];
    let uniqueBimesters = [];
    let uniqueCourses = [];
    let uniqueCategories = [];

    // Hardcoded category weights as per user feedback
    const categoryWeightsMap = {
        'Appreciation': 0.10, // 10%
        'Daily Grades': 0.60, // 60%
        'Exams and Projects': 0.30 // 30%
    };

    // Helper function to apply color based on grade value
    function applyGradeColor(gradeValue, element) {
        const grade = parseFloat(gradeValue);
        element.classList.remove('grade-red', 'grade-orange', 'grade-light-green', 'grade-dark-green'); // Remove existing classes

        if (gradeValue === 'X' || gradeValue === 'N/A' || isNaN(grade)) {
            element.classList.add('grade-red'); // Apply red for empty/non-numeric grades
            return;
        }

        if (grade >= 1 && grade < 3) {
            element.classList.add('grade-red');
        } else if (grade >= 3 && grade < 4) {
            element.classList.add('grade-orange');
        } else if (grade >= 4 && grade <= 4.5) {
            element.classList.add('grade-light-green');
        } else if (grade > 4.5 && grade <= 5) {
            element.classList.add('grade-dark-green');
        }
    }

    // Helper function to format date consistently
    function formatDate(dateString) {
        if (!dateString || dateString === 'N/A') {
            return 'N/A';
        }
        // Expected format: "MM/DD/AA"
        const parts = dateString.split('/');
        if (parts.length === 3) {
            const month = parseInt(parts[0], 10);
            const day = parseInt(parts[1], 10);
            let year = parseInt(parts[2], 10);

            // Handle two-digit year (assuming 20xx for years <= 99)
            if (year >= 0 && year <= 99) {
                year += 2000; // Assuming 20xx
            }

            // Create a Date object (month is 0-indexed in JavaScript Date)
            const dateObj = new Date(year, month - 1, day);

            // Check if the date is valid
            if (!isNaN(dateObj.getTime()) && dateObj.getFullYear() === year && dateObj.getMonth() === month - 1 && dateObj.getDate() === day) {
                const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
                return dateObj.toLocaleDateString('es-ES', options);
            }
        }
        console.warn(`Could not parse date string "${dateString}" with MM/DD/AA format.`);
        return dateString; // Fallback to original string if parsing fails or format is unexpected
    }

    // Fetch grades from storage
    chrome.storage.local.get(['schoologyGrades'], (result) => {
        allGrades = result.schoologyGrades;

        if (!allGrades || allGrades.length === 0) {
            gradesContainer.innerHTML = '<p>No grades found. Please scrape grades from Schoology first.</p>';
            return;
        }

        uniqueBimesters = [...new Set(allGrades.map(grade => grade.period))].sort();
        uniqueCourses = [...new Set(allGrades.map(grade => grade.course))].sort();
        uniqueCategories = [...new Set(allGrades.map(grade => grade.category))].sort();

        populateBimesterDropdown(); // For main display
        populateToolDropdowns(); // For new tools
        populateCategoryDropdowns(); // For new tools
        renderGradesTable(bimesterSelect.value);
    });

    // Populate bimester dropdown for main display
    function populateBimesterDropdown() {
        // Add "All Bimesters" option
        const allOption = document.createElement('option');
        allOption.value = 'all';
        allOption.textContent = 'All Bimesters';
        bimesterSelect.appendChild(allOption);

        uniqueBimesters.forEach(bimester => {
            const option = document.createElement('option');
            option.value = bimester;
            option.textContent = bimester;
            bimesterSelect.appendChild(option);
        });

        bimesterSelect.addEventListener('change', (event) => {
            renderGradesTable(event.target.value);
        });
    }

    // Populate dropdowns for the new tools
    function populateToolDropdowns() {
        // Populate Course dropdowns
        [neededGradeCourseSelect, affectAverageCourseSelect].forEach(selectElement => {
            selectElement.innerHTML = '<option value="">Select Course</option>'; // Default option
            uniqueCourses.forEach(course => {
                const option = document.createElement('option');
                option.value = course;
                option.textContent = course;
                selectElement.appendChild(option);
            });
        });

        // Populate Bimester dropdowns
        [neededGradeBimesterSelect, affectAverageBimesterSelect].forEach(selectElement => {
            selectElement.innerHTML = '<option value="">Select Bimester</option>'; // Default option
            uniqueBimesters.forEach(bimester => {
                const option = document.createElement('option');
                option.value = bimester;
                option.textContent = bimester;
                selectElement.appendChild(option);
            });
        });
    }

    // Populate category dropdowns for the new tools
    function populateCategoryDropdowns() {
        const categoryDropdowns = [neededGradeCategorySelect, newGradeCategorySelect];
        categoryDropdowns.forEach(selectElement => {
            selectElement.innerHTML = '<option value="">Select Category (Optional)</option>'; // Default option
            // Add hardcoded categories first
            for (const categoryName in categoryWeightsMap) {
                const option = document.createElement('option');
                option.value = categoryName;
                option.textContent = categoryName;
                selectElement.appendChild(option);
            }
            // Add any other unique categories from grades data that are not hardcoded
            uniqueCategories.forEach(category => {
                if (!categoryWeightsMap.hasOwnProperty(category)) {
                    const option = document.createElement('option');
                    option.value = category;
                    option.textContent = category;
                    selectElement.appendChild(option);
                }
            });
        });
    }

    // Helper function to calculate weighted average for a set of grades
    function calculateWeightedAverage(gradesInContext) {
        let totalWeightedScore = 0;
        let totalWeight = 0;
        const calculationSteps = [];
        
        // Group grades by category within this context to calculate category averages
        const gradesGroupedByCategory = gradesInContext.reduce((acc, grade) => {
            if (!acc[grade.category]) {
                acc[grade.category] = [];
            }
            acc[grade.category].push(grade);
            return acc;
        }, {});

        for (const category in gradesGroupedByCategory) {
            const gradesInThisCategory = gradesGroupedByCategory[category];
            const validGradesInThisCategory = gradesInThisCategory.filter(g => g.value !== '—' && g.value !== 'X' && !isNaN(parseFloat(g.value)));
            
            let categoryAverage = 0;
            if (validGradesInThisCategory.length > 0) {
                const sumGrades = validGradesInThisCategory.reduce((sum, g) => sum + parseFloat(g.value), 0);
                categoryAverage = sumGrades / validGradesInThisCategory.length;
            }

            // Determine category weight
            let categoryWeightValue = 0;
            let categoryWeightDisplay = '';

            if (categoryWeightsMap.hasOwnProperty(category)) {
                categoryWeightValue = categoryWeightsMap[category];
                categoryWeightDisplay = `(${categoryWeightValue * 100}%)`;
            } else {
                // Fallback to existing grade's categoryWeight if available and not in hardcoded map
                const gradeWithWeight = gradesInThisCategory.find(g => g.categoryWeight);
                if (gradeWithWeight && gradeWithWeight.categoryWeight) {
                    const weightMatch = gradeWithWeight.categoryWeight.match(/\((\d+)%\)/);
                    if (weightMatch && weightMatch[1]) {
                        categoryWeightValue = parseFloat(weightMatch[1]) / 100;
                        categoryWeightDisplay = weightMatch[0];
                    }
                }
            }

            if (categoryWeightValue > 0) { // Only consider categories with a defined weight
                if (!isNaN(categoryAverage) && validGradesInThisCategory.length > 0) {
                    const weightedCategoryScore = categoryAverage * categoryWeightValue;
                    totalWeightedScore += weightedCategoryScore;
                    totalWeight += categoryWeightValue;
                    calculationSteps.push(`${category}: ${categoryAverage.toFixed(2)} * ${categoryWeightDisplay} = ${weightedCategoryScore.toFixed(2)}`);
                } else {
                    // If category has weight but no valid grades, still include in steps as 0
                    calculationSteps.push(`${category}: No valid grades * ${categoryWeightDisplay} = 0.00`);
                }
            }
        }

        const finalAverage = totalWeight > 0 ? (totalWeightedScore / totalWeight).toFixed(2) : 'N/A';
        return { average: finalAverage, steps: calculationSteps, totalWeight: totalWeight };
    }

    // Function to calculate needed grade
    function calculateNeededGrade() {
        const course = neededGradeCourseSelect.value;
        const bimester = neededGradeBimesterSelect.value;
        const targetAverage = parseFloat(targetAverageInput.value);
        let category = neededGradeCategorySelect.value;
        // Removed weight input

        neededGradeResultDiv.style.display = 'none';
        neededGradeOutput.innerHTML = '';

        if (!course || !bimester || isNaN(targetAverage)) {
            neededGradeOutput.innerHTML = '<span style="color: red;">Please select a course, bimester, and enter a valid target average.</span>';
            neededGradeResultDiv.style.display = 'block';
            return;
        }

        const gradesForContext = allGrades.filter(g => g.course === course && g.period === bimester);
        if (gradesForContext.length === 0) {
            neededGradeOutput.innerHTML = `<span style="color: red;">No grades found for ${course} in ${bimester}.</span>`;
            neededGradeResultDiv.style.display = 'block';
            return;
        }

        const currentAverageResult = calculateWeightedAverage(gradesForContext);
        const currentWeightedScore = parseFloat(currentAverageResult.average) * currentAverageResult.totalWeight;
        const currentTotalWeight = currentAverageResult.totalWeight;

        // Determine weight based on selected category
        let finalWeight = 0;

        if (category && categoryWeightsMap.hasOwnProperty(category)) {
            finalWeight = categoryWeightsMap[category];
        } else {
            // Fallback if no category selected or not in hardcoded map
            finalWeight = 0.10; // Default to 10%
        }

        if (finalWeight === 0) {
            neededGradeOutput.innerHTML = `<span style="color: red;">Cannot calculate needed grade with a 0% weight. Please select a category with a defined weight.</span>`;
            neededGradeResultDiv.style.display = 'block';
            return;
        }

        // Equation: (current_weighted_score + (needed_grade * finalWeight)) / (current_total_weight + finalWeight) = target_average
        const neededGrade = (targetAverage * (currentTotalWeight + finalWeight) - currentWeightedScore) / finalWeight;

        let resultText = `To achieve an average of ${targetAverage.toFixed(2)} in ${course} for ${bimester}, you need a grade of <span style="font-weight: bold; color: #007bff;">${neededGrade.toFixed(2)}</span> in a ${category || 'new'} activity worth ${finalWeight * 100}%.`;

        if (neededGrade > 5) {
            resultText += `<br><span style="color: red;">This grade (${neededGrade.toFixed(2)}) is higher than the maximum possible (5.0). It might be difficult or impossible to reach your target average.</span>`;
        } else if (neededGrade < 0) {
            resultText += `<br><span style="color: green;">You've already surpassed your target average! Your current average is ${currentAverageResult.average}.</span>`;
        }
        
        neededGradeOutput.innerHTML = resultText;
        neededGradeResultDiv.style.display = 'block';
    }

    // Function to calculate how a new grade affects average
    function calculateAffectAverage() {
        const course = affectAverageCourseSelect.value;
        const bimester = affectAverageBimesterSelect.value;
        const newGradeValue = parseFloat(newGradeInput.value);
        let category = newGradeCategorySelect.value;
        // Removed weight input

        affectAverageResultDiv.style.display = 'none';
        affectAverageOutput.innerHTML = '';

        if (!course || !bimester || isNaN(newGradeValue)) {
            affectAverageOutput.innerHTML = '<span style="color: red;">Please select a course, bimester, and enter a valid new grade.</span>';
            affectAverageResultDiv.style.display = 'block';
            return;
        }

        const gradesForContext = allGrades.filter(g => g.course === course && g.period === bimester);
        
        // Determine weight based on selected category
        let finalWeight = 0;

        if (category && categoryWeightsMap.hasOwnProperty(category)) {
            finalWeight = categoryWeightsMap[category];
        } else {
            // Fallback if no category selected or not in hardcoded map
            finalWeight = 0.10; // Default to 10%
        }

        if (finalWeight === 0) {
            affectAverageOutput.innerHTML = `<span style="color: red;">Cannot calculate with a 0% weight. Please select a category with a defined weight.</span>`;
            affectAverageResultDiv.style.display = 'block';
            return;
        }

        // Create a temporary grade object for the new grade
        const newGradeObject = {
            course: course,
            period: bimester,
            category: category || 'Hypothetical', // Use selected category or 'Hypothetical'
            categoryWeight: `(${finalWeight * 100}%)`, // Format as expected by calculateWeightedAverage
            value: newGradeValue.toString(),
            item: 'Hypothetical Grade'
        };

        const gradesWithNew = [...gradesForContext, newGradeObject];
        const newAverageResult = calculateWeightedAverage(gradesWithNew);

        let resultText = `If you get a ${newGradeValue.toFixed(2)} in a ${category || 'new'} activity worth ${finalWeight * 100}% in ${course} for ${bimester}, your new average would be <span style="font-weight: bold; color: #007bff;">${newAverageResult.average}</span>.`;
        
        resultText += `<h3>Calculation Steps:</h3>`;
        newAverageResult.steps.forEach(step => {
            resultText += `<p>${step}</p>`;
        });

        affectAverageOutput.innerHTML = resultText;
        affectAverageResultDiv.style.display = 'block';
    }

    // Render grades table
    function renderGradesTable(selectedBimester) {
        gradesContainer.innerHTML = ''; // Clear previous table

        const table = document.createElement('table');
        const thead = document.createElement('thead');
        const tbody = document.createElement('tbody');
        const headerRow = document.createElement('tr');
        const materiaTh = document.createElement('th');
        materiaTh.textContent = 'Materia';
        headerRow.appendChild(materiaTh);

        if (selectedBimester === 'all') {
            // Mode: All Bimesters (columns are Bimesters)
            const uniquePeriods = [...new Set(allGrades.map(grade => grade.period))].sort();
            uniquePeriods.forEach(period => {
                const th = document.createElement('th');
                const trimmedPeriod = period.trim();
                const bimesterMatch = trimmedPeriod.match(/BIMESTER (\d+)/i); // Case-insensitive, capture the number
                th.textContent = bimesterMatch ? `BIMESTER ${bimesterMatch[1]}` : trimmedPeriod;
                headerRow.appendChild(th);
            });
            const overallAverageTh = document.createElement('th');
            overallAverageTh.textContent = 'Average';
            headerRow.appendChild(overallAverageTh);
            thead.appendChild(headerRow);
            table.appendChild(thead);

            const uniqueCourses = [...new Set(allGrades.map(grade => grade.course))].sort();

            uniqueCourses.forEach(courseName => {
                const row = document.createElement('tr');
                const courseCell = document.createElement('td');
                courseCell.textContent = courseName;
                courseCell.classList.add('course-name-cell');
                row.appendChild(courseCell);

                let courseOverallWeightedScore = 0;
                let courseOverallTotalWeight = 0;
                const courseOverallCalculationSteps = [];
                let validBimesterAveragesCount = 0;

                uniquePeriods.forEach(periodName => {
                    const cell = document.createElement('td');
                    const gradeContainer = document.createElement('div');
                    gradeContainer.classList.add('grade-container');
                    gradeContainer.classList.add('category-average'); // Style bimester averages like averages

                    const gradesInPeriodForCourse = allGrades.filter(grade => grade.course === courseName && grade.period === periodName);
                    
                    let bimesterAverageResult = calculateWeightedAverage(gradesInPeriodForCourse);

                    const bimesterRect = document.createElement('div');
                    bimesterRect.classList.add('grade-rectangle');
                    bimesterRect.textContent = bimesterAverageResult.average;
                    if (bimesterAverageResult.average === 'X' || bimesterAverageResult.average === 'N/A') {
                        bimesterRect.classList.add('empty');
                    } else {
                        bimesterRect.dataset.isAverage = 'true';
                        bimesterRect.dataset.subject = courseName;
                        bimesterRect.dataset.period = periodName;
                        bimesterRect.dataset.finalAverage = bimesterAverageResult.average;
                        bimesterRect.dataset.calculationSteps = JSON.stringify(bimesterAverageResult.steps);
                        bimesterRect.addEventListener('click', showAverageDetails);
                        applyGradeColor(bimesterAverageResult.average, bimesterRect); // Apply color

                        // Add to overall course average calculation
                        if (bimesterAverageResult.average !== 'N/A' && bimesterAverageResult.average !== 'X') {
                            courseOverallWeightedScore += parseFloat(bimesterAverageResult.average);
                            validBimesterAveragesCount++;
                            courseOverallCalculationSteps.push(`${periodName}: ${bimesterAverageResult.average}`);
                        }
                    }
                    gradeContainer.appendChild(bimesterRect);
                    cell.appendChild(gradeContainer);
                    row.appendChild(cell);
                });

                // Overall Course Average
                const overallAverageCell = document.createElement('td');
                const overallAverageRect = document.createElement('div');
                overallAverageRect.classList.add('grade-rectangle', 'category-average');
                overallAverageRect.dataset.isAverage = 'true';
                overallAverageRect.dataset.subject = courseName;

                if (validBimesterAveragesCount > 0) {
                    const overallCourseAverage = (courseOverallWeightedScore / validBimesterAveragesCount).toFixed(2);
                    overallAverageRect.textContent = overallCourseAverage;
                    overallAverageRect.dataset.finalAverage = overallCourseAverage;
                    overallAverageRect.dataset.calculationSteps = JSON.stringify(courseOverallCalculationSteps);
                    overallAverageRect.addEventListener('click', showAverageDetails);
                    applyGradeColor(overallCourseAverage, overallAverageRect); // Apply color
                } else {
                    overallAverageRect.textContent = 'N/A';
                    overallAverageRect.classList.add('empty');
                }
                overallAverageCell.appendChild(overallAverageRect);
                row.appendChild(overallAverageCell);
                tbody.appendChild(row);
            });

            // Calculate and display overall bimester averages and grand total average
            const overallBimesterAveragesDiv = document.createElement('div');
            overallBimesterAveragesDiv.style.marginTop = '20px';
            overallBimesterAveragesDiv.style.padding = '15px';
            overallBimesterAveragesDiv.style.backgroundColor = '#e0f2f7'; /* Light blue background */
            overallBimesterAveragesDiv.style.border = '1px solid #81d4fa'; /* Blue border */
            overallBimesterAveragesDiv.style.borderRadius = '8px';
            overallBimesterAveragesDiv.style.textAlign = 'center';
            overallBimesterAveragesDiv.style.fontWeight = 'bold';
            overallBimesterAveragesDiv.style.fontSize = '18px';
            overallBimesterAveragesDiv.style.color = '#01579b'; /* Darker blue text */
            overallBimesterAveragesDiv.innerHTML = '<h3>Overall Bimester Averages:</h3>';

            let grandTotalWeightedScore = 0;
            let grandTotalValidBimesterAveragesCount = 0;
            const grandTotalCalculationSteps = [];

            uniquePeriods.forEach(periodName => {
                const gradesInPeriod = allGrades.filter(grade => grade.period === periodName);
                const bimesterAverageResult = calculateWeightedAverage(gradesInPeriod);

                if (bimesterAverageResult.average !== 'N/A') {
                    const p = document.createElement('p');
                    p.textContent = `${periodName}: ${bimesterAverageResult.average}`;
                    p.style.cursor = 'pointer';
                    p.dataset.isAverage = 'true';
                    p.dataset.subject = `Overall ${periodName}`;
                    p.dataset.finalAverage = bimesterAverageResult.average;
                    p.dataset.calculationSteps = JSON.stringify(bimesterAverageResult.steps);
                    p.addEventListener('click', showAverageDetails);
                    overallBimesterAveragesDiv.appendChild(p);

                    grandTotalWeightedScore += parseFloat(bimesterAverageResult.average);
                    grandTotalValidBimesterAveragesCount++;
                    grandTotalCalculationSteps.push(`${periodName}: ${bimesterAverageResult.average}`);
                }
            });

            const grandAverage = grandTotalValidBimesterAveragesCount > 0 ? (grandTotalWeightedScore / grandTotalValidBimesterAveragesCount).toFixed(2) : 'N/A';
            const grandAverageP = document.createElement('p');
            grandAverageP.style.marginTop = '10px';
            grandAverageP.style.borderTop = '1px solid #81d4fa';
            grandAverageP.style.paddingTop = '10px';
            grandAverageP.textContent = `Grand Overall Average: ${grandAverage}`;
            grandAverageP.style.cursor = 'pointer';
            grandAverageP.dataset.isAverage = 'true';
            grandAverageP.dataset.subject = 'Grand Overall Average';
            grandAverageP.dataset.finalAverage = grandAverage;
            grandAverageP.dataset.calculationSteps = JSON.stringify(grandTotalCalculationSteps);
            grandAverageP.addEventListener('click', showAverageDetails);
            overallBimesterAveragesDiv.appendChild(grandAverageP);

            gradesContainer.appendChild(overallBimesterAveragesDiv);

        } else {
            // Mode: Individual Bimester (columns are Categories)
            const filteredGrades = allGrades.filter(grade => grade.period === selectedBimester);

            // Group grades by course and then by category
            const groupedByCourseAndCategory = filteredGrades.reduce((acc, grade) => {
                if (!acc[grade.course]) {
                    acc[grade.course] = {};
                }
                if (!acc[grade.course][grade.category]) {
                    acc[grade.course][grade.category] = [];
                }
                acc[grade.course][grade.category].push(grade);
                return acc;
            }, {});

            const uniqueCourses = [...new Set(Object.keys(groupedByCourseAndCategory))].sort();
            const allCategories = [...new Set(filteredGrades.map(grade => grade.category))];

            const sortedCategories = allCategories.sort((a, b) => {
                const order = ['Daily Grades', 'Appreciation', 'Exams and Projects', 'Uncategorized'];
                const indexA = order.indexOf(a);
                const indexB = order.indexOf(b);

                if (indexA === -1 && indexB === -1) {
                    return a.localeCompare(b);
                }
                if (indexA === -1) return 1;
                if (indexB === -1) return -1;
                return indexA - indexB;
            });

            // Create table header
            sortedCategories.forEach(category => {
                const th = document.createElement('th');
                const gradeWithWeight = filteredGrades.find(g => g.category === category && g.categoryWeight);
                const categoryDisplay = gradeWithWeight ? `${category} ${gradeWithWeight.categoryWeight}` : category;
                th.textContent = categoryDisplay;
                headerRow.appendChild(th);
            });
            const averageTh = document.createElement('th');
            averageTh.textContent = 'Average';
            headerRow.appendChild(averageTh);
            thead.appendChild(headerRow);
            table.appendChild(thead);

            // Populate table body
            uniqueCourses.forEach(courseName => {
                const row = document.createElement('tr');
                const courseCell = document.createElement('td');
                courseCell.textContent = courseName;
                courseCell.classList.add('course-name-cell');
                row.appendChild(courseCell);

                const gradesForCourseInBimester = filteredGrades.filter(g => g.course === courseName);
                const courseAverageResult = calculateWeightedAverage(gradesForCourseInBimester);
                const calculationSteps = courseAverageResult.steps;
                let totalWeightedScore = parseFloat(courseAverageResult.average) * courseAverageResult.totalWeight; // Recalculate for display consistency
                let totalWeight = courseAverageResult.totalWeight;


                sortedCategories.forEach(category => {
                    const cell = document.createElement('td');
                    const gradeContainer = document.createElement('div');
                    gradeContainer.classList.add('grade-container');
                    const categoryClass = category.toLowerCase().replace(/\s/g, '-').replace(/[^a-z0-9-]/g, '');
                    gradeContainer.classList.add(`category-${categoryClass}`);

                    const gradesInCell = groupedByCourseAndCategory[courseName]?.[category] || [];

                    if (gradesInCell.length > 0) {
                        gradesInCell.forEach(grade => {
                            const gradeRect = document.createElement('div');
                            gradeRect.classList.add('grade-rectangle');
                            gradeRect.textContent = grade.value === '—' ? 'X' : grade.value;
                            if (grade.value === '—') {
                            gradeRect.classList.add('empty');
                        }
                        gradeRect.dataset.activityName = grade.item;
                        gradeRect.dataset.category = grade.category;
                        gradeRect.dataset.gradeValue = grade.value;
                        gradeRect.dataset.subject = grade.course;
                        gradeRect.dataset.dueDate = grade.dueDate; // Pass due date
                        gradeRect.dataset.assignmentUrl = grade.assignmentUrl; // Pass assignment URL
                        gradeRect.addEventListener('click', showGradeDetails);
                        applyGradeColor(grade.value, gradeRect); // Apply color
                        gradeContainer.appendChild(gradeRect);
                    });
                    } else {
                        const emptyRect = document.createElement('div');
                        emptyRect.classList.add('grade-rectangle', 'empty');
                        emptyRect.textContent = 'X';
                        gradeContainer.appendChild(emptyRect);
                    }
                    cell.appendChild(gradeContainer);
                    row.appendChild(cell);
                });

                // Display course average
                const averageCell = document.createElement('td');
                const averageRect = document.createElement('div');
                averageRect.classList.add('grade-rectangle', 'category-average');
                averageRect.dataset.isAverage = 'true';
                averageRect.dataset.subject = courseName;

                if (totalWeight > 0) {
                    const courseAverage = (totalWeightedScore / totalWeight).toFixed(2);
                    averageRect.textContent = courseAverage;
                    averageRect.dataset.finalAverage = courseAverage;
                    averageRect.dataset.calculationSteps = JSON.stringify(calculationSteps);
                    averageRect.addEventListener('click', showAverageDetails);
                    applyGradeColor(courseAverage, averageRect); // Apply color
                } else {
                    averageRect.textContent = 'N/A';
                    averageRect.classList.add('empty');
                }
                averageCell.appendChild(averageRect);
                row.appendChild(averageCell);

                tbody.appendChild(row);
            });

            // Calculate and display total bimester average
            const bimesterOverallAverageResult = calculateWeightedAverage(filteredGrades);
            if (bimesterOverallAverageResult.average !== 'N/A') {
                const totalAverageDiv = document.createElement('div');
                totalAverageDiv.style.marginTop = '20px';
                totalAverageDiv.style.padding = '15px';
                totalAverageDiv.style.backgroundColor = '#e8f5e9'; /* Light green background */
                totalAverageDiv.style.border = '1px solid #a5d6a7'; /* Green border */
                totalAverageDiv.style.borderRadius = '8px';
                totalAverageDiv.style.textAlign = 'center';
                totalAverageDiv.style.fontWeight = 'bold';
                totalAverageDiv.style.fontSize = '18px';
                totalAverageDiv.style.color = '#2e7d32'; /* Darker green text */
                totalAverageDiv.textContent = `Total Bimester Average: ${bimesterOverallAverageResult.average}`;
                
                // Add click listener to show calculation steps for the total bimester average
                totalAverageDiv.dataset.isAverage = 'true';
                totalAverageDiv.dataset.subject = `Overall Bimester ${selectedBimester}`;
                totalAverageDiv.dataset.finalAverage = bimesterOverallAverageResult.average;
                totalAverageDiv.dataset.calculationSteps = JSON.stringify(bimesterOverallAverageResult.steps);
                totalAverageDiv.addEventListener('click', showAverageDetails);

                gradesContainer.appendChild(totalAverageDiv);
            }
        }
        table.appendChild(tbody);
        gradesContainer.appendChild(table);
    }

    // Show grade details modal (for individual grades)
    function showGradeDetails(event) {
        modalTitle.textContent = 'Activity Details';
        modalAverageDetails.style.display = 'none'; // Hide average details
        document.getElementById('modalActivityName').parentElement.style.display = 'block';
        document.getElementById('modalActivityLink').parentElement.style.display = 'block'; // Show activity link
        document.getElementById('modalCategory').parentElement.style.display = 'block';
        document.getElementById('modalGradeValue').parentElement.style.display = 'block';
        document.getElementById('modalSubject').parentElement.style.display = 'block';
        modalDueDate.parentElement.style.display = 'block'; // Show due date

        const { activityName, category, gradeValue, subject, dueDate, assignmentUrl } = event.target.dataset;
        
        // Make activity name clickable if assignmentUrl exists
        if (assignmentUrl) {
            modalActivityLink.innerHTML = `<a href="${assignmentUrl}" target="_blank">${activityName}</a>`;
            modalActivityName.style.display = 'none'; // Hide plain text activity name
        } else {
            modalActivityName.textContent = activityName;
            modalActivityLink.innerHTML = ''; // Clear link if no URL
            modalActivityName.style.display = 'block'; // Show plain text activity name
        }

        modalCategory.textContent = category;
        modalGradeValue.textContent = gradeValue;
        modalSubject.textContent = subject;
        
        // Format due date using the helper function
        modalDueDate.textContent = formatDate(dueDate);
        console.log(`Display: Formatted Due Date for "${activityName}": "${modalDueDate.textContent}"`);
        
        modal.style.display = 'flex';
    }

    // Show average details modal
    function showAverageDetails(event) {
        modalTitle.textContent = 'Average Details';
        document.getElementById('modalActivityName').parentElement.style.display = 'none';
        document.getElementById('modalCategory').parentElement.style.display = 'none';
        document.getElementById('modalGradeValue').parentElement.style.display = 'none';
        document.getElementById('modalSubject').parentElement.style.display = 'none';
        modalDueDate.parentElement.style.display = 'none'; // Hide due date
        modalAverageDetails.style.display = 'block'; // Show average details

        const { subject, finalAverage, calculationSteps } = event.target.dataset;
        modalSubject.textContent = subject; // Re-use subject span for course name in average modal
        modalFinalAverage.textContent = finalAverage;
        
        averageCalculationSteps.innerHTML = '';
        const steps = JSON.parse(calculationSteps);
        steps.forEach(step => {
            const p = document.createElement('p');
            p.textContent = step;
            averageCalculationSteps.appendChild(p);
        });

        modal.style.display = 'flex';
    }

    // Close modal
    closeButton.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });

    // Add event listeners for new tool buttons
    calculateNeededGradeBtn.addEventListener('click', calculateNeededGrade);
    calculateAffectAverageBtn.addEventListener('click', calculateAffectAverage);
});
