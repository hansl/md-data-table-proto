import { MdDataTableProtoPage } from './app.po';

describe('md-data-table-proto App', function() {
  let page: MdDataTableProtoPage;

  beforeEach(() => {
    page = new MdDataTableProtoPage();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});
