// SystemJS configuration file, see links for more information
// https://github.com/systemjs/systemjs
// https://github.com/systemjs/systemjs/blob/master/docs/config-api.md

/***********************************************************************************************
 * User Configuration.
 **********************************************************************************************/
/** Map relative paths to URLs. */
const map: any = {
  '@angular2-material/core': '/vendor/@angular2-material/core',
  '@angular2-material/button': '/vendor/@angular2-material/button',
  '@angular2-material/checkbox': '/vendor/@angular2-material/checkbox',
  '@angular2-material/input': '/vendor/@angular2-material/input',
};

/** User packages configuration. */
const packages: any = {
  '@angular2-material/core': { main: 'core.js' },
  '@angular2-material/button': { main: 'button' },
  '@angular2-material/checkbox': { main: 'checkbox' },
  '@angular2-material/input': { main: 'input' },
};

////////////////////////////////////////////////////////////////////////////////////////////////
/***********************************************************************************************
 * Everything underneath this line is managed by the CLI.
 **********************************************************************************************/
const barrels: string[] = [
  // Angular specific barrels.
  '@angular/core',
  '@angular/common',
  '@angular/compiler',
  '@angular/forms',
  '@angular/http',
  '@angular/router',
  '@angular/platform-browser',
  '@angular/platform-browser-dynamic',

  // Thirdparty barrels.
  'rxjs',

  // App specific barrels.
  'app',
  'app/components/table',
  'app/components/table/table-editable',
  'app/components/table/table-for',
  'app/components/table/table-global-selector',
  'app/components/table/table-header',
  'app/components/table/table-selector',
  'app/demo-table',
  /** @cli-barrel */
];

const cliSystemConfigPackages: any = {};
barrels.forEach((barrelName: string) => {
  cliSystemConfigPackages[barrelName] = { main: 'index' };
});

/** Type declaration for ambient System. */
declare var System: any;

// Apply the CLI SystemJS configuration.
System.config({
  map: {
    '@angular': 'vendor/@angular',
    'rxjs': 'vendor/rxjs',
    'main': 'main.js'
  },
  packages: cliSystemConfigPackages
});

// Apply the user's configuration.
System.config({ map, packages });
