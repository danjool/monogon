const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');
const pixelmatch = require('pixelmatch').default;
const { PNG } = require('pngjs');

class VisualRegressionTester {
  constructor(options = {}) {
    this.options = {
      headless: false,
      width: 1920,
      height: 1080,
      timeout: 120000,
      screenshotDir: './public/test/screenshots',
      referenceDir: './public/test/reference-screenshots',
      diffDir: './public/test/diff-screenshots',
      threshold: 0.2,
      waitTime: 1000, // for scene stabilization
      ...options
    };

    // Test URLs from index.html analysis
    this.testUrls = [
      { path: '/', name: 'index' },
      { path: '/books/', name: 'books' },
      { path: '/books/writeup/', name: 'books-writeup' },
      { path: '/turtle/', name: 'turtle' },
      { path: '/carpet-sweeper/', name: 'carpet-sweeper' },
      { path: '/raytracing/', name: 'raytracing' },
      { path: '/concepts/', name: 'concepts' },
      { path: '/wat/', name: 'wat' },
      { path: '/riemann/', name: 'riemann' },
      { path: '/cards/', name: 'cards' },
      { path: '/asteroids/index.html#50000', name: 'asteroids-50k' },
      { path: '/asteroids/index.html#200000', name: 'asteroids-200k' },
      { path: '/eightqueens/', name: 'eightqueens' },
      { path: '/solchess/', name: 'solchess' },
      { path: '/scalecompare/scalecomparehi.html', name: 'scalecompare-hi' },
      { path: '/scalecompare/scalecompareringworld.html', name: 'scalecompare-ringworld' },
      { path: '/nbody/gravity.html#64', name: 'nbody-4k' },
      { path: '/nbody/gravity.html#128', name: 'nbody-16k' },
      { path: '/pointcloud/ncar.html#4', name: 'pointcloud-ncar' },
      { path: '/pointcloud/olympus.html#8', name: 'pointcloud-olympus' },
      { path: '/orbittrap/', name: 'orbittrap' },
      { path: '/errata/mtmistake.html#256', name: 'errata-crystal-smoke' },
      { path: '/errata/nuclei.html#64', name: 'errata-atomic-rainbow' },
      { path: '/errata/gol.html#1024', name: 'errata-game-of-life' },
      { path: '/tycho/', name: 'tycho' },
      { path: '/penguins/', name: 'penguins' },
      { path: '/platonic-solids.html', name: 'platonic-solids' },
      { path: '/flow.html', name: 'flow' },
      { path: '/synthesis/', name: 'synthesis' }
    ];

    this.results = [];
  }

  async initialize() {
    // Launch browser
    this.browser = await puppeteer.launch({
      headless: this.options.headless,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--max_old_space_size=4096'
      ]
    });

    this.page = await this.browser.newPage();
    await this.page.setViewport({
      width: this.options.width,
      height: this.options.height
    });

    // Create directories
    await fs.mkdir(this.options.screenshotDir, { recursive: true });
    await fs.mkdir(this.options.referenceDir, { recursive: true });
    await fs.mkdir(this.options.diffDir, { recursive: true });
  }

  async captureScreenshot(url, filename) {
    console.log(`Capturing: ${url}`);
    
    try {
      await this.page.goto(url, { waitUntil: 'networkidle0', timeout: this.options.timeout });
      
      // Wait for Three.js and scene stabilization
      try {
        await this.page.waitForFunction(() => {
          return document.querySelector('canvas') || document.querySelector('#ThreeJS');
        }, { timeout: 10000 });
      } catch (e) {
        console.log(`No canvas found for ${url}, continuing anyway...`);
      }

      // Wait for scene to stabilize
      await new Promise(resolve => setTimeout(resolve, this.options.waitTime));

      const screenshotPath = path.join(this.options.screenshotDir, `${filename}.png`);
      await this.page.screenshot({ path: screenshotPath });
      
      return screenshotPath;
    } catch (error) {
      console.error(`Error capturing ${url}:`, error.message);
      return null;
    }
  }

  async compareImages(actualPath, referencePath, diffPath) {
    try {
      const actualImg = PNG.sync.read(await fs.readFile(actualPath));
      const referenceImg = PNG.sync.read(await fs.readFile(referencePath));
      
      const { width, height } = actualImg;
      const diff = new PNG({ width, height });

      const diffPixels = pixelmatch(
        actualImg.data,
        referenceImg.data,
        diff.data,
        width,
        height,
        { threshold: this.options.threshold }
      );

      await fs.writeFile(diffPath, PNG.sync.write(diff));

      const totalPixels = width * height;
      const diffPercentage = (diffPixels / totalPixels) * 100;
      const similarity = 100 - diffPercentage;

      return {
        diffPixels,
        totalPixels,
        diffPercentage,
        similarity,
        passed: similarity >= 70
      };
    } catch (error) {
      console.error('Error comparing images:', error.message);
      return {
        error: error.message,
        passed: false
      };
    }
  }

  async generateReference() {
    console.log('Generating reference screenshots...');
    
    for (const testUrl of this.testUrls) {
      const url = `http://localhost:3000${testUrl.path}`;
      const filename = testUrl.name;
      
      const screenshotPath = await this.captureScreenshot(url, filename);
      if (screenshotPath) {
        // Copy to reference directory
        const referencePath = path.join(this.options.referenceDir, `${filename}.png`);
        await fs.copyFile(screenshotPath, referencePath);
        console.log(`Reference saved: ${filename}`);
      }
    }
  }

  async runTests() {
    console.log('Running visual regression tests...');
    
    for (const testUrl of this.testUrls) {
      const url = `http://localhost:3000${testUrl.path}`;
      const filename = testUrl.name;
      
      console.log(`Testing: ${filename}`);
      
      // Capture current screenshot
      const actualPath = await this.captureScreenshot(url, filename);
      if (!actualPath) {
        this.results.push({
          name: filename,
          url: testUrl.path,
          error: 'Failed to capture screenshot',
          passed: false
        });
        continue;
      }

      // Compare with reference
      const referencePath = path.join(this.options.referenceDir, `${filename}.png`);
      const diffPath = path.join(this.options.diffDir, `${filename}.png`);

      try {
        await fs.access(referencePath);
      } catch (error) {
        this.results.push({
          name: filename,
          url: testUrl.path,
          error: 'No reference image found',
          passed: false
        });
        continue;
      }

      const comparison = await this.compareImages(actualPath, referencePath, diffPath);
      
      this.results.push({
        name: filename,
        url: testUrl.path,
        actualPath,
        referencePath,
        diffPath,
        ...comparison
      });
    }
  }

  async generateReport() {
    const total = this.results.length;
    const passed = this.results.filter(r => r.passed).length
    
    const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Visual Regression Test Results</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 5px; }
        .header { margin-bottom: 15px; }
        .test-grid { display: grid; grid-template-columns: 150px 1fr 1fr 1fr; gap: 5px; margin-bottom: 10px; align-items: center; }
        .test-name { font-weight: bold; font-size: 12px; }
        .similarity { font-size: 11px; color: #666; }
        .image-column { text-align: center; }
        .image-column img { border: 1px solid #ccc; max-width: 100%; }
        .header-row { font-weight: bold; background: #f5f5f5; padding: 5px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Visual Regression Test Results: Generated ${new Date().toISOString()}</h1>
    </div>

    <div class="test-grid header-row">
        <div>Test Name</div>
        <div>Expected</div>
        <div>Actual</div>
        <div>Diff</div>
    </div>

    ${this.results.sort((a, b) => (a.similarity || 0) - (b.similarity || 0)).map(result => `
        <div class="test-grid">
            <div>
                <div class="test-name">${result.name}</div>
                ${result.similarity ? `<div class="similarity">${result.similarity.toFixed(1)}%</div>` : ''}
                ${result.error ? `<div class="similarity error">${result.error}</div>` : ''}
            </div>
            <div class="image-column">
                ${result.referencePath ? `<img src="${path.relative('./public/test', result.referencePath)}" alt="Reference">` : ''}
            </div>
            <div class="image-column">
                ${result.actualPath ? `<img src="${path.relative('./public/test', result.actualPath)}" alt="Actual">` : ''}
            </div>
            <div class="image-column">
                ${result.diffPath ? `<img src="${path.relative('./public/test', result.diffPath)}" alt="Diff">` : ''}
            </div>
        </div>
    `).join('')}

</body>
</html>`;

    await fs.writeFile('./public/test/test-results.html', html);
    console.log(`Report generated: test-results.html`);
    console.log(`Tests passed: ${passed}/${total}`);
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

// CLI usage
async function main() {
  const action = process.argv[2];
  const tester = new VisualRegressionTester();

  try {
    await tester.initialize();

    if (action === 'reference') {
      await tester.generateReference();
    } else if (action === 'test') {
      await tester.runTests();
      await tester.generateReport();
    } else {
      console.log('Usage: node visual-regression-test.js [reference|test]');
      console.log('  reference - Generate reference screenshots');
      console.log('  test      - Run tests and generate report (default)');
    }
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await tester.cleanup();
  }
}

if (require.main === module) {
  main();
}

module.exports = { VisualRegressionTester };