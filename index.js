// LIBRARY OF IMPORTER
import { TextPrompt, isCancel } from '@clack/core';
import puppeteer, { ConsoleMessage } from 'puppeteer';
import Table from 'cli-table3';
import ora from 'ora';
import fs from 'fs';
import opn from 'opn';
import xlsx from 'xlsx';
import mysql from 'mysql';
import init from './utils/init';
import cli from './utils/cli';
import log from './utils/log';

// VARIABLE INITIALIZATION
const input = cli.input;
const flags = cli.flags;
const { clear, debug } = flags;

// MAIN SCRIPTS
(async () => {
	init({ clear });
	input.includes(`help`) && cli.showHelp(0);
	debug && log(flags);

	console.log('_____________________________________________________')
	console.log('🚀 Name		: Kazima')
	console.log('📄 Desc		: Unlimited Fast Data Scraping')
	console.log('🧑 Developer	: Elzains')
	console.log('🏢 Company	: Qusthantinia')
	console.log('-----------------------------------------------------')

	// GET TEXTPROMPT FROM URL YOUTUBE
	const p = new TextPrompt({
		render() {
			return `👉 Enter The Target YouTube Video URL ?\n${this.valueWithCursor}`;
		}
	});
	const youtubeUrl = await p.prompt();
	if (isCancel(youtubeUrl)) {
		process.exit(0);
	}
	// Call the scraping function with the provided YouTube URL
	await scrapeComments(youtubeUrl);
})();

async function scrapeComments(url) {
	const spinner = ora('Processing Scaping Data...\n').start();
	const browser = await puppeteer.launch({ headless: 'new' });
	const page = await browser.newPage();

	try {
		// Open the YouTube page with the given URL
		await page.goto(url, { waitUntil: 'domcontentloaded' });

		// Infinite Scroll
		let previousHeight;
		while (true) {
			const currentHeight = await page.evaluate(
				'document.documentElement.scrollHeight'
			);

			// Scroll down
			await page.evaluate(
				'window.scrollTo(0, document.documentElement.scrollHeight)'
			);
			await page.waitForTimeout(2000); // Wait briefly after scrolling

			// Check if it has reached the end of the page
			if (currentHeight === previousHeight) {
				break;
			}

			previousHeight = currentHeight;
		}

		// Get comments after infinite scroll is done
		const comments = await page.evaluate(() => {
			const commentElements = document.querySelectorAll(
				'#content #content-text'
			);
			const commentList = [];

			commentElements.forEach(commentElement => {
				commentList.push(commentElement.textContent.trim());
			});

			return commentList;
		});
		// Display comments
		if (comments.length > 0) {
			const table = new Table({
				head: ['ID', 'COMMENTS', 'TIMESERIES'],
				colWidths: [10, 90,]
			});

			comments.forEach((comment, index) => {
				const timestamp = new Date().toISOString();
				table.push([(index + 1).toString(), comment, timestamp]);
			});

			// Display the table
			console.log(table.toString());
			console.log('\n\n\n');
			spinner.stop();

			// Export data to JSON
			const jsonData = comments.map((comment, index) => ({
				ID: (index + 1).toString(),
				COMMENTS: comment,
				TIMESERIES: new Date().toISOString(),
			}));

			const jsonFileName = 'results_json.json';
			const xlsxFileName = 'results_excel.xlsx';
			const sqlFileName = 'results_sql';

			// Write JSON
			fs.writeFile(jsonFileName, JSON.stringify(jsonData, null, 2), (err) => {
				if (err) {
					console.error('Error writing to JSON file:', err);
				} else {
				// console.log(`Data exported to ${jsonFileName}`);
				openFileExplorer(jsonFileName);
				}
			});

			// Write Excel
			const ws = xlsx.utils.json_to_sheet(jsonData);
			const wb = xlsx.utils.book_new();
			xlsx.utils.book_append_sheet(wb, ws, 'Sheet 1');
			xlsx.writeFile(wb, xlsxFileName);
			// console.log(`Data exported to ${xlsxFileName}`);
			openFileExplorer(xlsxFileName);

			// Write to SQL file
			const sqlData = jsonData.map(data => {
				return `INSERT INTO your_table_name (ID, COMMENTS, TIMESERIES) VALUES ('${data.ID}', '${data.COMMENTS}', '${data.TIMESERIES}');`;
			});
  
  fs.writeFile(sqlFileName, sqlData.join('\n'), (err) => {
	if (err) {
	  console.error('Error writing to SQL file:', err);
	} else {
	//   console.log(`Data exported to ${sqlFileName}`);
	  openFileExplorer(sqlFileName);
	}
  });
//   Open Explorer
  function openFileExplorer(fileName) {
	opn(fileName, { wait: false });
  }

		} else {
			console.log('Scraping Gagal. Check Internetmu...!');
		}
		// Comment End
	} catch (error) {
		console.error('Error during scraping:', error);
	} finally {
		// Close the browser
		await browser.close();
	}
}
