(async () => {
    try {
        // Expand all collapsible sections first
        const expandableElements = document.querySelectorAll('.report-row.has-children.childrenCollapsed .title-column.clickable');
        expandableElements.forEach(el => {
            el.click(); // Simulate click to expand
        });

        // Give a small delay for the DOM to update after expansion
        await new Promise(resolve => setTimeout(resolve, 1500)); // Increased delay to 1.5 seconds

        const gradesData = [];
        const courseElements = document.querySelectorAll('.gradebook-course.hierarchical-grading-report');

        courseElements.forEach(courseEl => {
            // Extract course name, removing visually-hidden text
            const courseTitleEl = courseEl.querySelector('.gradebook-course-title a');
            let courseName = 'N/A';
            if (courseTitleEl) {
                const clone = courseTitleEl.cloneNode(true);
                clone.querySelectorAll('.visually-hidden').forEach(el => el.remove());
                courseName = clone.textContent.trim();
            }
            
            const courseId = courseEl.id.replace('s-js-gradebook-course-', ''); // Extract course ID from element ID

            let currentPeriodName = 'N/A';
            let currentPeriodId = null;
            let currentCategoryName = 'N/A';
            let currentCategoryId = null;
            let currentCategoryWeight = ''; // New variable for category weight

            const allRows = courseEl.querySelectorAll('table tbody tr');

            allRows.forEach(row => {
                const rowId = row.dataset.id;
                const parentId = row.dataset.parentId;

                if (row.classList.contains('period-row') && parentId === courseId) {
                    // This is a new period
                    const periodTitleEl = row.querySelector('.title-column .title');
                    if (periodTitleEl) {
                        const clone = periodTitleEl.cloneNode(true);
                        clone.querySelectorAll('.visually-hidden').forEach(el => el.remove());
                        currentPeriodName = clone.textContent.trim().replace('Grading Period', '').trim();
                    } else {
                        currentPeriodName = 'N/A';
                    }
                    currentPeriodId = rowId;
                    currentCategoryName = 'N/A'; // Reset category for new period
                    currentCategoryId = null;
                    currentCategoryWeight = ''; // Reset category weight
                } else if (row.classList.contains('category-row') && parentId === currentPeriodId) {
                    // This is a new category within the current period
                    const categoryTitleEl = row.querySelector('.title-column .title');
                    if (categoryTitleEl) {
                        const clone = categoryTitleEl.cloneNode(true);
                        clone.querySelectorAll('.visually-hidden').forEach(el => el.remove());
                        currentCategoryName = clone.textContent.trim();
                    }
                    const percentageContribEl = row.querySelector('.percentage-contrib');
                    currentCategoryWeight = percentageContribEl ? percentageContribEl.textContent.trim() : '';
                    currentCategoryId = rowId;
                } else if (row.classList.contains('item-row') && (parentId === currentCategoryId || parentId === currentPeriodId)) {
                    // This is a grade item
                    const gradeItemTitleEl = row.querySelector('.title-column .title');
                    let gradeItem = 'N/A';
                    let assignmentUrl = ''; // New variable for assignment URL
                    if (gradeItemTitleEl) {
                        const linkEl = gradeItemTitleEl.querySelector('a');
                        if (linkEl) {
                            assignmentUrl = linkEl.href; // Get the href attribute
                        }
                        const clone = gradeItemTitleEl.cloneNode(true);
                        clone.querySelectorAll('.visually-hidden').forEach(el => el.remove());
                        gradeItem = clone.textContent.trim();
                    }
                    
                    // Extract due date
                    const dueDateEl = row.querySelector('.due-date');
                    let dueDate = '';
                    if (dueDateEl) {
                        const clone = dueDateEl.cloneNode(true);
                        clone.querySelectorAll('.visually-hidden').forEach(el => el.remove());
                        dueDate = clone.textContent.trim();
                    } else {
                        // If due date element is not found, explicitly set to empty string
                        dueDate = ''; 
                    }
                    console.log(`Content: Scraped Due Date for "${gradeItem}": "${dueDate}"`); // Log scraped due date

                    let gradeValue = 'N/A';
                    const awardedGradeEl = row.querySelector('.grade-column .awarded-grade .rounded-grade');
                    const noGradeEl = row.querySelector('.grade-column .no-grade');
                    const rubricGradeEl = row.querySelector('.grade-column .rubric-grade-value');

                    if (awardedGradeEl) {
                        gradeValue = awardedGradeEl.textContent.trim();
                    } else if (noGradeEl) {
                        gradeValue = noGradeEl.textContent.trim();
                    } else if (rubricGradeEl) {
                        const maxGradeEl = row.querySelector('.grade-column .max-grade');
                        const rubricScore = parseFloat(rubricGradeEl.textContent.trim());
                        if (maxGradeEl) {
                            const maxScoreText = maxGradeEl.textContent.trim().replace('/', '').trim();
                            const maxScore = parseFloat(maxScoreText);
                            if (!isNaN(rubricScore) && !isNaN(maxScore) && maxScore > 0) {
                                gradeValue = ((rubricScore / maxScore) * 5).toFixed(2); // Convert to 1-5 scale
                            } else {
                                gradeValue = `${rubricScore} / ${maxScoreText}`; // Fallback if conversion fails
                            }
                        } else {
                            gradeValue = rubricScore.toFixed(2); // If no max score, just use rubric score
                        }
                    }

                    // Handle grades like "4.3 / 5" or "41 / 45"
                    if (typeof gradeValue === 'string' && gradeValue.includes('/')) {
                        const parts = gradeValue.split('/').map(s => parseFloat(s.trim()));
                        if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1]) && parts[1] > 0) {
                            gradeValue = ((parts[0] / parts[1]) * 5).toFixed(2); // Convert to 1-5 scale
                        }
                    } else if (!isNaN(parseFloat(gradeValue))) {
                        // If it's already a number, ensure it's formatted to 2 decimal places
                        gradeValue = parseFloat(gradeValue).toFixed(2);
                    }

                    // Normalize category names before pushing to data
                    let finalCategoryName = currentCategoryName;
                    const lowerCaseCategory = finalCategoryName.toLowerCase();

                    if (lowerCaseCategory.includes('daily grades')) {
                        finalCategoryName = 'Daily Grades';
                    } else if (lowerCaseCategory.includes('appreciation')) {
                        finalCategoryName = 'Appreciation';
                    } else if (lowerCaseCategory.includes('exams and projects')) {
                        finalCategoryName = 'Exams and Projects';
                    } else if (finalCategoryName === 'N/A') {
                        finalCategoryName = 'Uncategorized'; // For items directly under period
                    }

                    gradesData.push({
                        course: courseName,
                        period: currentPeriodName,
                        item: gradeItem,
                        category: finalCategoryName, // Use normalized category here
                        categoryWeight: currentCategoryWeight, // Store category weight
                        value: gradeValue,
                        dueDate: dueDate, // Store due date
                        assignmentUrl: assignmentUrl // Store assignment URL
                    });
                }
            });
        });

        await chrome.storage.local.set({schoologyGrades: gradesData});
        chrome.runtime.sendMessage({action: "gradesScraped"});
    } catch (error) {
        console.error("Schoology Grades Scraper Error:", error);
        chrome.runtime.sendMessage({action: "scrapeError", error: error.message});
    }
})();
