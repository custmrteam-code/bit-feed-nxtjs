"use client";

// Text-to-speech article reader, ported from the ArticleReader class in
// articles/article.js. Reads the article aloud word-by-word with a moving
// highlighter and draggable progress bars (vertical on desktop, horizontal on
// mobile). Operates imperatively on the rendered DOM (by id), matching the
// legacy implementation; `destroy()` is added for React unmount cleanup.

type Cleanup = () => void;

export class ArticleReader {
  private isPlaying = false;
  private isPaused = false;
  private isDragging = false;
  private currentWordIndex = 0;
  private words: string[] = [];
  private wordElements: HTMLSpanElement[] = [];
  private highlighters: HTMLDivElement[] = [];
  private utterance: SpeechSynthesisUtterance | null = null;
  private cleanups: Cleanup[] = [];
  private prepared = false;

  constructor() {
    this.init();
  }

  private $(id: string) {
    return document.getElementById(id);
  }

  private init() {
    const playBtn = this.$("play-pause-btn-circle");
    const verticalBar = this.$("progress-bar-vertical");
    const progressHandle = this.$("progress-handle-vertical");
    const readerContainer = this.$("reader-container-vertical");
    if (!playBtn) return;

    const onPlay = () => {
      const isMobile = window.innerWidth <= 600;
      if (this.words.length === 0) this.prepareArticleText();

      if (!this.isPlaying) {
        if (isMobile && readerContainer) {
          readerContainer.classList.add("expanded");
          setTimeout(() => {
            this.startReading();
            this.$("mobile-progress-container")?.classList.add("active");
          }, 400);
        } else {
          this.startReading();
          verticalBar?.classList.remove("hidden");
        }
      } else if (this.isPaused) {
        this.resumeReading();
      } else {
        this.pauseReading();
      }
    };

    playBtn.addEventListener("click", onPlay);
    this.cleanups.push(() => playBtn.removeEventListener("click", onPlay));

    if (verticalBar && progressHandle) {
      this.initDraggableProgress(verticalBar, progressHandle);
    }
    this.initMobileProgressBar();

    setTimeout(() => this.prepareArticleText(), 100);
  }

  private initMobileProgressBar() {
    const bar = this.$("progress-bar-horizontal");
    const handle = this.$("progress-handle-horizontal");
    if (!bar || !handle) return;

    const seek = (clientX: number) => {
      if (this.words.length === 0) return;
      const rect = bar.getBoundingClientRect();
      const clampedX = Math.max(0, Math.min(clientX - rect.left, rect.width));
      const pct = Math.max(0, Math.min(1, clampedX / rect.width));
      let idx = Math.floor(pct * this.words.length);
      idx = Math.max(0, Math.min(idx, this.words.length - 1));
      this.currentWordIndex = idx;
      this.updateProgress();
      if (!this.isDragging && this.isPlaying && !this.isPaused) {
        window.speechSynthesis.cancel();
        this.readWords();
      } else {
        this.updateFloatingHighlighter(this.currentWordIndex);
      }
    };

    const onDown = (e: MouseEvent) => {
      this.isDragging = true;
      seek(e.clientX);
      e.preventDefault();
    };
    const onMove = (e: MouseEvent) => {
      if (this.isDragging) seek(e.clientX);
    };
    const onUp = () => {
      if (!this.isDragging) return;
      this.isDragging = false;
      if (this.isPlaying && !this.isPaused) {
        window.speechSynthesis.cancel();
        this.readWords();
      }
    };
    const onTouchStart = (e: TouchEvent) => {
      this.isDragging = true;
      seek(e.touches[0].clientX);
      e.preventDefault();
    };
    const onTouchMove = (e: TouchEvent) => {
      if (this.isDragging) {
        seek(e.touches[0].clientX);
        e.preventDefault();
      }
    };
    const onTouchEnd = () => onUp();

    handle.addEventListener("mousedown", onDown);
    bar.addEventListener("mousedown", onDown);
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    handle.addEventListener("touchstart", onTouchStart);
    bar.addEventListener("touchstart", onTouchStart);
    document.addEventListener("touchmove", onTouchMove, { passive: false });
    document.addEventListener("touchend", onTouchEnd);

    this.cleanups.push(() => {
      handle.removeEventListener("mousedown", onDown);
      bar.removeEventListener("mousedown", onDown);
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      handle.removeEventListener("touchstart", onTouchStart);
      bar.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onTouchEnd);
    });
  }

  private initDraggableProgress(progressBar: HTMLElement, handle: HTMLElement) {
    const seek = (clientY: number) => {
      if (this.words.length === 0) return;
      const rect = progressBar.getBoundingClientRect();
      const clampedY = Math.max(0, Math.min(clientY - rect.top, rect.height));
      const pct = Math.max(0, Math.min(1, 1 - clampedY / rect.height));
      let idx = Math.floor(pct * this.words.length);
      idx = Math.max(0, Math.min(idx, this.words.length - 1));
      this.currentWordIndex = idx;
      this.updateProgress();
      if (!this.isDragging && this.isPlaying && !this.isPaused) {
        window.speechSynthesis.cancel();
        this.readWords();
      } else {
        this.updateFloatingHighlighter(this.currentWordIndex);
      }
    };

    const onDown = (e: MouseEvent) => {
      this.isDragging = true;
      seek(e.clientY);
      e.preventDefault();
    };
    const onMove = (e: MouseEvent) => {
      if (this.isDragging) seek(e.clientY);
    };
    const onUp = () => {
      if (!this.isDragging) return;
      this.isDragging = false;
      if (this.isPlaying && !this.isPaused) {
        window.speechSynthesis.cancel();
        this.readWords();
      }
    };
    const onTouchStart = (e: TouchEvent) => {
      this.isDragging = true;
      seek(e.touches[0].clientY);
      e.preventDefault();
    };
    const onTouchMove = (e: TouchEvent) => {
      if (this.isDragging) {
        seek(e.touches[0].clientY);
        e.preventDefault();
      }
    };
    const onTouchEnd = () => onUp();

    handle.addEventListener("mousedown", onDown);
    progressBar.addEventListener("mousedown", onDown);
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    handle.addEventListener("touchstart", onTouchStart);
    progressBar.addEventListener("touchstart", onTouchStart);
    document.addEventListener("touchmove", onTouchMove, { passive: false });
    document.addEventListener("touchend", onTouchEnd);

    this.cleanups.push(() => {
      handle.removeEventListener("mousedown", onDown);
      progressBar.removeEventListener("mousedown", onDown);
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      handle.removeEventListener("touchstart", onTouchStart);
      progressBar.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onTouchEnd);
    });
  }

  /** Wrap each word in the article body in a span for highlighting. */
  prepareArticleText() {
    const contentEl = this.$("article-content");
    if (!contentEl) return;

    const blocks = contentEl.querySelectorAll(
      "p, div, h1, h2, h3, h4, h5, h6, li, blockquote",
    );
    this.words = [];
    this.wordElements = [];
    const newContainer = document.createElement("div");

    blocks.forEach((block) => {
      if (!block.textContent?.trim()) return;
      const newBlock = document.createElement(block.tagName);
      newBlock.className = block.className;
      newBlock.style.position = "relative";
      newBlock.style.zIndex = "2";

      block.textContent.split(/(\s+)/).forEach((word) => {
        if (word.trim()) {
          const span = document.createElement("span");
          span.className = "word";
          span.textContent = word;
          this.wordElements.push(span);
          this.words.push(word);
          newBlock.appendChild(span);
        } else {
          newBlock.appendChild(document.createTextNode(word));
        }
      });
      newContainer.appendChild(newBlock);
    });

    contentEl.innerHTML = "";
    while (newContainer.firstChild) contentEl.appendChild(newContainer.firstChild);
    this.prepared = true;
  }

  /** True once the body has been tokenized (used to gate level-switch resets). */
  isPrepared() {
    return this.prepared;
  }

  private startReading() {
    this.isPlaying = true;
    this.isPaused = false;
    if (this.currentWordIndex >= this.words.length) this.currentWordIndex = 0;
    this.updateButtonUI("pause");
    this.readWords();
  }

  private pauseReading() {
    this.isPaused = true;
    window.speechSynthesis.cancel();
    this.updateButtonUI("play");
    this.updateFloatingHighlighter(this.currentWordIndex);
  }

  private resumeReading() {
    this.isPaused = false;
    this.updateButtonUI("pause");
    this.readWords();
  }

  stopReading() {
    this.isPlaying = false;
    this.isPaused = false;
    this.currentWordIndex = 0;
    window.speechSynthesis.cancel();
    this.updateButtonUI("play");
    this.highlighters.forEach((h) => h.remove());
    this.highlighters = [];
    this.updateProgress();

    if (window.innerWidth <= 600) {
      this.$("mobile-progress-container")?.classList.remove("active");
      setTimeout(() => {
        this.$("reader-container-vertical")?.classList.remove("expanded");
      }, 400);
    }
  }

  private readWords() {
    if (this.isPaused || this.currentWordIndex >= this.words.length) {
      if (this.currentWordIndex >= this.words.length) this.stopReading();
      return;
    }
    this.updateFloatingHighlighter(this.currentWordIndex);

    const word = this.words[this.currentWordIndex];
    if (!window.speechSynthesis) return;

    this.utterance = new SpeechSynthesisUtterance(word);
    this.utterance.rate = 1.0;
    this.utterance.pitch = 1.0;
    this.utterance.volume = 1.0;
    this.utterance.lang = "en-US";

    this.utterance.onend = () => {
      if (this.isDragging) return;
      this.currentWordIndex++;
      this.updateProgress();
      setTimeout(() => this.readWords(), 50);
    };
    this.utterance.onerror = (event) => {
      if (event.error === "interrupted") return;
      if (!this.isDragging) {
        this.currentWordIndex++;
        this.readWords();
      }
    };

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(this.utterance);
  }

  private updateFloatingHighlighter(index: number) {
    this.highlighters.forEach((h) => h.remove());
    this.highlighters = [];

    const prev = index > 0 ? this.wordElements[index - 1] : null;
    const current = this.wordElements[index];
    const next =
      index < this.wordElements.length - 1 ? this.wordElements[index + 1] : null;
    if (!current) return;

    const articleContent = this.$("article-content");
    if (!articleContent) return;

    const words = [prev, current, next].filter(
      (w): w is HTMLSpanElement => w !== null,
    );

    const lineGroups: HTMLSpanElement[][] = [];
    let currentLine: HTMLSpanElement[] = [];
    let lastTop: number | null = null;

    words.forEach((word) => {
      const rect = word.getBoundingClientRect();
      if (rect.width === 0) return;
      const top = Math.round(rect.top);
      if (lastTop === null || Math.abs(top - lastTop) < 5) {
        currentLine.push(word);
      } else {
        if (currentLine.length > 0) lineGroups.push(currentLine);
        currentLine = [word];
      }
      lastTop = top;
    });
    if (currentLine.length > 0) lineGroups.push(currentLine);

    lineGroups.forEach((lineWords) => {
      const firstRect = lineWords[0].getBoundingClientRect();
      const lastRect = lineWords[lineWords.length - 1].getBoundingClientRect();
      const contentRect = articleContent.getBoundingClientRect();

      const highlighter = document.createElement("div");
      highlighter.className = "floating-highlighter";
      highlighter.style.left = `${firstRect.left - contentRect.left}px`;
      highlighter.style.top = `${firstRect.top - contentRect.top}px`;
      highlighter.style.width = `${lastRect.right - firstRect.left}px`;
      highlighter.style.height = `${Math.max(firstRect.height, lastRect.height)}px`;

      articleContent.appendChild(highlighter);
      this.highlighters.push(highlighter);
    });
  }

  private updateProgress() {
    if (this.words.length === 0) return;
    const progress = (this.currentWordIndex / this.words.length) * 100;
    const v = this.$("progress-fill-vertical");
    if (v) v.style.height = `${progress}%`;
    const h = this.$("progress-fill-horizontal");
    if (h) h.style.width = `${progress}%`;
  }

  private updateButtonUI(state: "play" | "pause") {
    const btn = this.$("play-pause-btn-circle");
    if (!btn) return;
    if (state === "pause") {
      btn.classList.add("playing");
      btn.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>`;
    } else {
      btn.classList.remove("playing");
      btn.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>`;
    }
  }

  /** Remove all listeners and stop speech (React unmount cleanup). */
  destroy() {
    try {
      window.speechSynthesis.cancel();
    } catch {
      /* ignore */
    }
    this.cleanups.forEach((fn) => fn());
    this.cleanups = [];
    this.highlighters.forEach((h) => h.remove());
    this.highlighters = [];
  }
}
