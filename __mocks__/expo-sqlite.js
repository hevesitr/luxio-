const mockDatabase = {
  transaction: jest.fn((callback) => {
    const mockTx = {
      executeSql: jest.fn((sql, params, successCallback, errorCallback) => {
        // Mock successful execution
        if (successCallback) {
          successCallback(mockTx, { rows: { _array: [], length: 0 } });
        }
      }),
    };
    callback(mockTx);
  }),
};

const openDatabase = jest.fn(() => mockDatabase);

export { openDatabase };
export default { openDatabase };
