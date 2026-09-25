/* 演示模块注册表：各模块通过 register(id, factory) 注册，
 * factory(container) -> { destroy() }，由 detail.js 挂载/销毁 */
window.DemoRegistry = {
  _modules: {},
  register: function (id, factory) { this._modules[id] = factory; },
  get: function (id) { return this._modules[id]; }
};
