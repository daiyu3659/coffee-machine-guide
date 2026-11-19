# Dinamica 三维操作指南（技术可行性原型）

De'Longhi ECAM350.55.B（Dinamica）咖啡机的 Web 三维操作指南原型：Three.js 场景 + 可拨动视角立方体 + 按键状态机 + 模拟机载屏幕。

> **性质说明**：本项目是**技术可行性验证原型**，用于验证"三维操作指南"这一交互形态是否可行，**不是德龙官方产品，也未获得德龙官方授权或背书**。界面不保证与真机一致。

## 本地运行

项目使用 ES Module 与 `importmap`，必须通过 HTTP 服务打开，直接双击 `index.html`（`file://`）会因跨域限制无法加载模块。

```bash
# 在本 README 所在的项目目录下执行
python3 -m http.server 8765
```

然后在浏览器打开 <http://127.0.0.1:8765/>。

- 端口可任意替换（如 `8766`），改了端口就访问对应地址即可。
- 也可以用任意静态服务器，例如 `npx serve -l 8765`。
- 桌面端：拖拽旋转、滚轮缩放、点击机身按键与可动件；移动端：点按弹出按键说明，底部为步骤条，右上角可展开/收起模拟屏。

## 目录

```
index.html              页面结构与 UI
assets/app.js           场景、状态机、交互逻辑
assets/style.css        界面样式
assets/refine.glb       外部建模参考得到的外壳/奶壶模型
assets/ref/*.jpg|pdf    产品参考图与官方说明书（本地参考，不纳入仓库）
assets/three.module.js  Three.js r149
```

## 授权说明

本项目的**代码与文档**（`index.html`、`assets/app.js`、`assets/style.css`、`assets/loaders/`、`assets/utils/` 中的代码，以及本 README 等文字内容）以 **Creative Commons Attribution-NonCommercial 4.0 International（CC BY-NC 4.0）** 发布，署名：**2026 daiyu3659**。

- 允许：复制、分发、修改、基于本项目再创作、再发布。
- 必须：署名（2026 daiyu3659）并注明是否修改；附上许可证链接。
- 禁止：用于商业目的（不得以商业优势或金钱报酬为主要目的使用）。
- 完整法律文本见 [LICENSE](./LICENSE)；协议原文：<https://creativecommons.org/licenses/by-nc/4.0/legalcode>

## 素材归属（不在 CC 授权范围内）

`assets/ref/` 下的产品参考图、官方说明书 PDF、机身贴图等素材来自 **De'Longhi 官网与公开资料**，**版权归 De'Longhi 所有**，仅用于本原型的技术可行性演示与比例核对：

- 这些素材**不适用**本仓库的 CC BY-NC 4.0 授权，也不随本项目一并授权。
- 不得将其用于任何商业用途，不得二次分发用于与本演示无关的场景。
- 如需商用，请自行向 De'Longhi 取得授权，或将其替换为自有/已获授权的素材。
- 逐条来源与页面链接见本地维护的《素材清单与可行性结论》，该清单不随仓库发布。

为了控制仓库体积，`assets/ref/`（参考图与说明书 PDF，约 4 MB）与本地维护的《素材清单与可行性结论》**均不纳入版本库**，仅保留在本地作为核对依据；仓库中只包含页面运行所需的文件。因此克隆仓库后 `assets/ref/` 为空属于正常现象，不影响页面运行。

本原型中的三维模型为按公开尺寸与参考图重建的程序化几何，仅作形态与交互验证，不代表真实产品的精确外观。
