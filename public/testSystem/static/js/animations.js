const questionsBar = document.getElementById('questions');
questionsBar.mousedown = 0;

questionsBar.addEventListener('mousedown', (e) => {
    questionsBar.mousedown = 1;
});

window.addEventListener('mouseup', (e) => {
    questionsBar.mousedown = 0;
});

questionsBar.addEventListener('mousemove', (e) => {
    questionsBar.scrollLeft -= e.movementX * questionsBar.mousedown;
});

questionsBar.addEventListener('wheel', (e) => {
    e.preventDefault();
    questionsBar.scrollLeft += e.deltaY;
})