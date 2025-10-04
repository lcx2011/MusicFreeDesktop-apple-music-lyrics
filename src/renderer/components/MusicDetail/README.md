# 播放详情页面 (AMLL 歌词播放器)

## 概述

这是一个完全重构的播放详情页面，完全复刻了参考项目的样式和布局。使用 `@applemusic-like-lyrics/react-full` 包提供的 `PrebuiltLyricPlayer` 组件。

## 主要特性

- ✅ **完整的 Apple Music 风格布局**: 左侧控制区域，右侧歌词显示
- ✅ **流畅的动画效果**: 从底部滑入/滑出，带圆角过渡
- ✅ **响应式字体大小**: 支持多种字体大小预设 (XS, S, M, L, XL, XXL)
- ✅ **全屏覆盖**: 完全覆盖应用界面，提供沉浸式体验
- ✅ **背景效果**: 自动模糊背景，缩放主应用界面
- ✅ **键盘支持**: ESC 键快速关闭
- ✅ **状态同步**: 与 AMLL 内部状态完全同步

## 使用方法

```typescript
import MusicDetail from './path/to/MusicDetail';

// 显示播放详情页
MusicDetail.show();

// 隐藏播放详情页
MusicDetail.hide();

// 或者直接操作 store
import { musicDetailShownStore } from './store';
musicDetailShownStore.setValue(true);
```

## 文件结构

```
├── index.tsx          # 主组件文件
├── index.scss         # 样式文件
├── store.ts           # 状态管理
└── utils/
    └── lyric-converter.ts  # 歌词格式转换工具
```

## 技术实现

### 核心组件
- 使用 `PrebuiltLyricPlayer` 作为核心组件，内置完整的歌词播放器功能
- 通过 CSS 类控制显示/隐藏状态
- 动态注入样式来控制字体大小

### 状态管理
- 使用 Jotai 原子状态管理
- 同步本地状态与 AMLL 内部状态
- 支持全局样式切换

### 样式系统
- 完全复刻参考项目的 CSS 动画和布局
- 支持全局背景效果和应用缩放
- 响应式设计，适配不同屏幕尺寸

## 与原版的区别

1. **简化的组件结构**: 移除了复杂的自定义布局组件
2. **更好的性能**: 直接使用优化过的 AMLL 组件
3. **完整的功能**: 包含所有 Apple Music 风格的交互和视觉效果
4. **更好的维护性**: 代码结构清晰，易于扩展

## 依赖要求

- `@applemusic-like-lyrics/react-full`
- `jotai`
- `classnames`
- React 18+