import React, { useEffect, useRef, useState } from "react";
import { Canvas, FabricImage, Polyline } from "fabric";
import {
  Alert,
  Button,
  Card,
  Checkbox,
  CheckboxChangeEvent,
  Flex,
  Popconfirm,
  Slider,
  Typography,
} from "antd";
const { Text } = Typography;
import { Sticker } from "./interface";
import jobsJson from "./assets/jobs_file_name.json";
import preloadJson from "./assets/preload_file_name.json";
import "./App.css";
import { addImageToCanvas, preloadImages } from "./CanvasToos";

// 预设参数
const DESIGN_WIDTH = 900;
const DESIGN_HEIGHT = 1920;
const GRID_SIZE = 60;

const BG_LIGHT = "#ededed";
const BG_DARK = "#202020";
const LINE_GRAY = "#888888";

const stickers = jobsJson as Sticker[];

let scale = 1;

const tabTitleList = [
  {
    key: "防护职业",
    label: "防护职业",
  },
  {
    key: "治疗职业",
    label: "治疗职业",
  },
  {
    key: "近战职业",
    label: "近战职业",
  },
  {
    key: "远程职业",
    label: "远程职业",
  },
  {
    key: "其他",
    label: "其他",
  },
];

const ImageEditor: React.FC = () => {
  const [loading, setLoading] = useState(true);
  // 画布相关引用
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fabricCanvas = useRef<Canvas | null>(null);

  // Tab 的引用
  const [activeTabKey, setActiveTabKey] = useState<string>(tabTitleList[0].key);
  const [stickerOptions, setStickerOptions] = useState<Sticker[]>([]);

  const [isVertical, setVertical] = useState<boolean>(true);
  const [isShowGrid, setShowGrid] = useState<boolean>(false);
  const [isDarkMode, setDarkMode] = useState<boolean>(false);
  const [gridLines, setGridLines] = useState<Polyline[]>([]);
  const [opacity, setOpacity] = useState<number>(100);

  useEffect(() => {
    if (!canvasRef.current) return;

    // 预加载图片资源
    preloadImages(preloadJson)
      .then(() => {
        console.log("所有图片加载完成");
        setLoading(false);
      })
      .catch((err) => {
        console.error("图片加载失败:", err);
        setLoading(false);
      });

    // 初始化 tab 下的职业选项（默认为防护职业）
    const opts = stickers
      .filter((s) => s.className === tabTitleList[0].key)
      .sort((a, b) =>
        a.jobIndex === b.jobIndex
          ? a.fileIndex - b.fileIndex
          : a.jobIndex - b.jobIndex,
      );
    setStickerOptions(opts);

    /**
     * 初始化画布
     */
    const canvasEleHeight = Math.floor(containerRef.current!.clientHeight);
    scale = canvasEleHeight / DESIGN_HEIGHT;
    console.log(`containerW:${containerRef.current!.clientWidth}`);
    console.log(`containerH:${containerRef.current!.clientHeight}`);
    console.log(`scale:${scale}`);
    const canvas = new Canvas(canvasRef.current, {
      width: DESIGN_WIDTH * scale,
      height: canvasEleHeight,
      backgroundColor: BG_LIGHT,
    });

    // 绑定移动事件实现吸附
    // canvas.on("object:moving", (options) => {
    //   const target = options.target;
    //   if (target) {
    //     // 计算最近的网格点
    //     // Math.round(当前位置 / 网格大小) * 网格大小
    //     const nextLeft = Math.round(target.left / 40) * 40;
    //     const nextTop = Math.round(target.top / 40) * 40;

    //     // 设置新坐标
    //     target.set({
    //       left: nextLeft,
    //       top: nextTop,
    //     });
    //   }
    // });

    // 加入参考网格
    const lineOptions = {
      stroke: LINE_GRAY,
      selectable: false,
      evented: false,
      excludeFromExport: true,
      hoverCursor: "default",
      visible: false,
    };
    const lines: Polyline[] = [];
    // 垂直线
    for (let i = 0; i <= DESIGN_HEIGHT / GRID_SIZE; i++) {
      const pLine = new Polyline(
        [
          { x: i * GRID_SIZE, y: 0 },
          {
            x: i * GRID_SIZE,
            y: DESIGN_HEIGHT,
          },
        ],
        lineOptions,
      );
      canvas.add(pLine);
      lines.push(pLine);
    }
    // 水平线
    for (let i = 0; i <= DESIGN_HEIGHT / GRID_SIZE; i++) {
      const pLine = new Polyline(
        [
          { x: 0, y: i * GRID_SIZE },
          {
            x: DESIGN_HEIGHT,
            y: i * GRID_SIZE,
          },
        ],
        lineOptions,
      );
      canvas.add(pLine);
      lines.push(pLine);
    }
    const verticalLineOptions = {
      stroke: "#4affff",
      scaleY: 3,
      selectable: false,
      evented: false,
      excludeFromExport: true,
      hoverCursor: "default",
      visible: false,
    };
    // 用于参考竖屏下面的线
    const verticalBottomLine = new Polyline(
      [
        { x: 0, y: DESIGN_HEIGHT - 220 },
        {
          x: DESIGN_HEIGHT,
          y: DESIGN_HEIGHT - 220,
        },
      ],
      verticalLineOptions,
    );
    canvas.add(verticalBottomLine);
    lines.push(verticalBottomLine);
    // 用于参考竖屏上面的线
    const verticalTopLine = new Polyline(
      [
        { x: 0, y: DESIGN_HEIGHT - 900 },
        {
          x: DESIGN_HEIGHT,
          y: DESIGN_HEIGHT - 900,
        },
      ],
      verticalLineOptions,
    );
    canvas.add(verticalTopLine);
    lines.push(verticalTopLine);
    setGridLines(lines);

    canvas.setZoom(scale);
    fabricCanvas.current = canvas;
    canvas.requestRenderAll();

    return () => {
      canvas.dispose();
    };
  }, []);

  /**
   * 处理 Card 的 tab 选择事件，更新职业列表
   * @param key tab 的 key，是职能名
   */
  const onTabChange = (key: string) => {
    setActiveTabKey(key);
    const opts = stickers
      .filter((s) => s.className === key)
      .sort((a, b) =>
        a.jobIndex === b.jobIndex
          ? a.fileIndex - b.fileIndex
          : a.jobIndex - b.jobIndex,
      );
    setStickerOptions(opts);
  };

  /**
   * 处理图片点击事件，点击后将图像绘制到 canvas 中
   * @param sticker 点击的对象
   */
  const handleOnStickerClick = async (sticker: Sticker) => {
    const canvas = fabricCanvas.current;
    if (!canvas) return;

    const y =
      sticker.fileIndex === 2
        ? DESIGN_HEIGHT - 220 - 150
        : DESIGN_HEIGHT - 930 - 150;
    const img = await addImageToCanvas(
      canvas,
      `./jobs/${sticker.fileName}`,
      isVertical ? DESIGN_WIDTH / 2 : DESIGN_HEIGHT / 2,
      isVertical ? y : DESIGN_HEIGHT / 2,
    );
    img?.set("opacity", Math.min(1, opacity / 100));
    canvas.renderAll();
  };

  /**
   * 显示参考网格
   * @param e checkbox 事件
   */
  const handleSetGrid = (e: CheckboxChangeEvent) => {
    const canvas = fabricCanvas.current;
    if (!canvas) return;

    setShowGrid(e.target.checked);
    gridLines.forEach((v) => {
      v.visible = e.target.checked;
    });
    canvas.requestRenderAll();
  };

  /**
   * 切换暗色模式
   * @param e checkbox事件
   */
  const handleSetDarkMode = (e: CheckboxChangeEvent) => {
    const canvas = fabricCanvas.current;
    if (!canvas) return;

    setDarkMode(e.target.checked);
    if (e.target.checked) {
      canvas.backgroundColor = BG_DARK;
      canvas.contextContainer.filter = "brightness(0.75)";
    } else {
      canvas.backgroundColor = BG_LIGHT;
      canvas.contextContainer.filter = "brightness(1)";
    }
    canvas.requestRenderAll();
  };

  /**
   * 处理切换横竖屏
   */
  const handleSetVertical = (e: CheckboxChangeEvent) => {
    const canvas = fabricCanvas.current;
    if (!canvas) return;

    setVertical(e.target.checked);
    if (e.target.checked) {
      canvas.setDimensions({
        width: DESIGN_WIDTH * scale,
      });
    } else {
      canvas.setDimensions({
        width: canvas.height,
      });
    }
    canvas.requestRenderAll();
  };

  const handleOnChangeComplete = (value: number) => {
    const canvas = fabricCanvas.current;
    if (!canvas) return;

    canvas.getObjects().forEach((obj) => {
      if (obj instanceof FabricImage) {
        // 对所有图像应用透明度
        obj.set("opacity", Math.min(1, value / 100));
      }
    });
    canvas.requestRenderAll();
  };

  /**
   * 清空画布，遍历 canvas 中的对象，移除 FabricImage
   */
  const handleClearCanvas = () => {
    const canvas = fabricCanvas.current;
    if (!canvas) return;
    const images = canvas
      .getObjects()
      .filter((obj) => obj instanceof FabricImage);

    canvas.remove(...images);
    canvas.renderAll();
  };

  /**
   * 导出图片
   * @returns
   */
  const handleExport = () => {
    const canvas = fabricCanvas.current;
    if (!canvas) return;

    // 如果显示了参考线，先隐藏，之后再显示出来
    if (isShowGrid) {
      gridLines.forEach((line) => {
        line.visible = false;
      });
    }

    // 计算缩放倍数
    const dataURL = canvas.toDataURL({
      format: "png",
      quality: 1,
      multiplier: DESIGN_HEIGHT / canvas.height,
    });

    // 下载图片
    const link = document.createElement("a");
    link.download = `职业小人贴贴乐${Date.now()}.png`;
    link.href = dataURL;
    link.click();

    if (isShowGrid) {
      gridLines.forEach((line) => {
        line.visible = true;
      });
    }
    canvas.renderAll();
  };

  return (
    <div
      className="container"
      style={{ width: "100%" }}
      onClick={(e) => {
        const canvas = fabricCanvas.current;
        if (!canvas) return;
        // 点击画布外时取消框选状态
        const canvasWrapper = canvas.getElement().parentElement;
        if (canvasWrapper && !canvasWrapper.contains(e.target as Node)) {
          canvas.discardActiveObject();
          canvas.requestRenderAll();
        }
      }}
    >
      {/* 画布 */}
      <div
        ref={containerRef}
        style={{
          height: "80vh",
        }}
      >
        <canvas
          style={{
            border: "1px solid #cccccc",
            boxShadow: "0 0 5px rgba(0,0,0,0.1)",
          }}
          ref={canvasRef}
        />
      </div>
      {/* 操作部分 */}
      <Flex className="option-container" justify="flex-start" vertical>
        <Flex justify="flex-start" gap="middle" vertical>
          {loading ? (
            <Alert
              title="正在下载，请等待列表中的图片完整显示后使用。"
              type="info"
              closable={{ closeIcon: true, "aria-label": "close" }}
            />
          ) : (
            <></>
          )}
          <Card
            tabList={tabTitleList}
            activeTabKey={activeTabKey}
            onTabChange={onTabChange}
            style={{ textAlign: "start" }}
            tabProps={{
              size: "small",
            }}
          >
            {stickerOptions.map((v) => (
              <img
                className="sticker"
                key={`${v.jobIndex}-${v.fileIndex}`}
                draggable={false}
                src={`./jobs/${v.coverFileName}`}
                onClick={() => {
                  handleOnStickerClick(v);
                }}
              />
            ))}
          </Card>
          <Checkbox
            checked={isShowGrid}
            onChange={handleSetGrid}
            style={{ width: "fit-content", userSelect: "none" }}
          >
            {"显示参考网格"}
          </Checkbox>
          <Checkbox
            checked={isDarkMode}
            onChange={handleSetDarkMode}
            style={{ width: "fit-content", userSelect: "none" }}
          >
            {"暗色模式"}
          </Checkbox>
          <Checkbox
            checked={isVertical}
            onChange={handleSetVertical}
            style={{ width: "fit-content", userSelect: "none" }}
          >
            {"竖屏模式"}
          </Checkbox>
          <Slider
            step={5}
            max={100}
            min={10}
            value={opacity}
            tooltip={{ formatter: (v) => `${v}%` }}
            marks={{ 30: "透明度30%", 60: "透明度60%", 90: "透明度90%" }}
            defaultValue={100}
            onChangeComplete={handleOnChangeComplete}
            onChange={(v) => setOpacity(v)}
          />
          <Popconfirm
            title="是否清空画布"
            description="将删除当前所有内容"
            onConfirm={handleClearCanvas}
            onCancel={() => {}}
            okText="确认"
            okType="danger"
            cancelText="取消"
          >
            <Button>清空画布</Button>
          </Popconfirm>

          <Button type="primary" onClick={handleExport}>
            保存图片
          </Button>
          <Flex justify="flex-start" vertical>
            <Text type="secondary" italic style={{ fontSize: 12 }}>
              绘制 by 不正雀 网页 by Nel
            </Text>
            <Text type="secondary" italic style={{ fontSize: 12 }}>
              无偿分享，严禁盗用、无料印刷、私自商用等
            </Text>
          </Flex>
        </Flex>
      </Flex>
    </div>
  );
};

export default ImageEditor;
