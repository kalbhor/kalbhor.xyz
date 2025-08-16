function createHeader() {
    return `
        <nav>
            <div class="hero">
                <a href="index.html" class="name-link">
                    <h1 class="name">Lakshay Kalbhor</h1>
                </a>
                <div class="social-links">
                    <a href="projects.html" class="social-link">Projects</a>
                    <a href="https://github.com/yourusername" class="social-link" target="_blank">GitHub</a>
                    <a href="https://linkedin.com/in/yourusername" class="social-link" target="_blank">LinkedIn</a>
                    <a href="https://twitter.com/yourusername" class="social-link" target="_blank">Twitter</a>
                    <a href="mailto:your.email@example.com" class="social-link">Email</a>
                </div>
            </div>
        </nav>
    `;
}

document.addEventListener('DOMContentLoaded', function() {
    const headerElement = document.getElementById('header');
    if (headerElement) {
        headerElement.innerHTML = createHeader();
    }
});