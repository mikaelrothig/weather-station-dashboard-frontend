import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, Copy, Download, Share2, X } from "lucide-react";
import { ShareDayData, getShareText } from "../../utils/shareUtils";
import { renderShareImage } from "../../utils/shareImage";

interface ShareDayDialogProps {
    data: ShareDayData | null;
    onClose: () => void;
}

const EXIT_MS = 200;

const canShareFiles = (file: File) => {
    try {
        return typeof navigator.canShare === "function" && navigator.canShare({ files: [file] });
    } catch {
        return false;
    }
};

const canCopyImage = () => typeof ClipboardItem !== "undefined" && !!navigator.clipboard?.write;

/**
 * Preview and send a day's forecast image. Phones get the native share sheet (WhatsApp in one tap);
 * desktop gets copy-to-clipboard for WhatsApp Web, plus a download either way.
 */
const ShareDayDialog = ({ data, onClose }: ShareDayDialogProps) => {
    const [image, setImage] = useState<{ url: string; file: File } | null>(null);
    const [failed, setFailed] = useState(false);
    const [copied, setCopied] = useState(false);
    const [closing, setClosing] = useState(false);
    const primaryRef = useRef<HTMLButtonElement>(null);
    const returnFocus = useRef<Element | null>(null);

    // Render the image for this day
    useEffect(() => {
        if (!data) return;
        let cancelled = false;
        let url: string | null = null;
        setImage(null);
        setFailed(false);
        renderShareImage(data)
            .then((blob) => {
                if (cancelled) return;
                url = URL.createObjectURL(blob);
                setImage({ url, file: new File([blob], `${data.fileSlug}.png`, { type: "image/png" }) });
            })
            .catch(() => !cancelled && setFailed(true));
        return () => {
            cancelled = true;
            if (url) URL.revokeObjectURL(url);
        };
    }, [data]);

    // Behave like a proper dialog: Escape closes, the page behind is inert, focus returns afterwards
    useEffect(() => {
        if (!data) return;
        returnFocus.current = document.activeElement;
        const app = document.getElementById("root");
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") close();
        };
        document.addEventListener("keydown", onKey);
        document.body.style.overflow = "hidden";
        if (app) app.inert = true;
        return () => {
            document.removeEventListener("keydown", onKey);
            document.body.style.overflow = "";
            if (app) app.inert = false;
            (returnFocus.current as HTMLElement | null)?.focus?.({ preventScroll: true });
        };
        // close is stable enough for this lifetime; re-subscribing on every render isn't needed
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data]);

    useEffect(() => {
        if (image) primaryRef.current?.focus({ preventScroll: true });
    }, [image]);

    if (!data) return null;

    // Exit is quicker than the entrance, and the dialog stays mounted until it's done
    function close() {
        setClosing(true);
        window.setTimeout(() => {
            setClosing(false);
            setCopied(false);
            onClose();
        }, EXIT_MS);
    }

    const shareable = image ? canShareFiles(image.file) : false;
    const text = getShareText(data);

    const share = async () => {
        if (!image) return;
        try {
            await navigator.share({ files: [image.file], title: `${data.spotName} forecast`, text });
        } catch {
            // Cancelled from the share sheet; nothing to do
        }
    };

    const copy = async () => {
        if (!image) return;
        try {
            await navigator.clipboard.write([new ClipboardItem({ "image/png": image.file })]);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 2000);
        } catch {
            download();
        }
    };

    const download = () => {
        if (!image) return;
        const link = document.createElement("a");
        link.href = image.url;
        link.download = image.file.name;
        link.click();
    };

    const button = "pressable flex h-11 flex-1 items-center justify-center gap-2 rounded-xl px-4 text-sm font-medium";
    const primary = `${button} bg-zinc-50 text-zinc-950 hover:bg-white disabled:opacity-50`;
    const secondary = `${button} bg-white/[0.08] text-zinc-100 hover:bg-white/[0.12] disabled:opacity-50`;

    return createPortal(
        <div className="fixed inset-0 z-[80] flex items-end justify-center md:items-center md:p-6">
            <div
                className={`share-scrim absolute inset-0 bg-black/70 ${closing ? "opacity-0" : ""}`}
                onClick={close}
                aria-hidden="true"
            />
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="share-title"
                data-closing={closing || undefined}
                className="share-dialog card relative flex max-h-[92dvh] w-full flex-col gap-4 rounded-b-none rounded-t-3xl p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] md:max-w-md md:rounded-3xl md:p-5"
            >
                <header className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                        <h2 id="share-title" className="text-base font-semibold text-zinc-100">Share forecast</h2>
                        <p className="truncate text-xs text-zinc-500">{data.spotName} · {data.dateLabel} · {data.modelName}</p>
                    </div>
                    <button type="button" onClick={close} aria-label="Close" className="btn-icon size-10">
                        <X className="size-4" />
                    </button>
                </header>

                <div className="relative mx-auto aspect-[4/5] w-full max-w-[22rem] overflow-hidden rounded-2xl bg-white/[0.04] ring-1 ring-inset ring-white/[0.06] md:max-w-none">
                    {image ? (
                        <img src={image.url} alt={text} className="animate-fade size-full object-contain" />
                    ) : failed ? (
                        <p className="grid size-full place-items-center p-6 text-center text-sm text-zinc-500">Couldn't create the image</p>
                    ) : (
                        <div className="size-full animate-pulse" aria-busy="true" aria-label="Creating image" />
                    )}
                </div>

                <div className="flex gap-2">
                    {shareable ? (
                        <>
                            <button ref={primaryRef} type="button" onClick={share} disabled={!image} className={primary}>
                                <Share2 className="size-4" aria-hidden="true" />
                                Share
                            </button>
                            <button type="button" onClick={download} disabled={!image} className={secondary}>
                                <Download className="size-4" aria-hidden="true" />
                                Save image
                            </button>
                        </>
                    ) : (
                        <>
                            {canCopyImage() && (
                                <button ref={primaryRef} type="button" onClick={copy} disabled={!image} className={primary}>
                                    {copied ? <Check className="size-4" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
                                    <span aria-live="polite">{copied ? "Copied" : "Copy image"}</span>
                                </button>
                            )}
                            <button
                                ref={canCopyImage() ? undefined : primaryRef}
                                type="button"
                                onClick={download}
                                disabled={!image}
                                className={canCopyImage() ? secondary : primary}
                            >
                                <Download className="size-4" aria-hidden="true" />
                                Download
                            </button>
                        </>
                    )}
                </div>

                <p className="text-center text-[11px] text-zinc-500">
                    The forecast only. Your kite settings aren't included.
                </p>
            </div>
        </div>,
        document.body,
    );
};

export default ShareDayDialog;
