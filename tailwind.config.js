/** @type {import('tailwindcss').Config} */
module.exports = {
	content: [
		"./index.html",
		"./src/**/*.{html,ts,php}"
	],
	darkMode: ['selector', { pattern: '[data-theme="dark"]' }],
	theme: {
		extend: {},
	},
	plugins: [],
}