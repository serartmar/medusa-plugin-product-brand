import { Button, FocusModal, useToast, Toaster, Text } from "@medusajs/ui";
import { useAdminCustomPost, useMedusa } from "medusa-react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { AdminPostProductBrandsReq } from "../../../../../api/_methods/create-brand";
import GeneralForm from "../../../forms/general-form";
import { ProductBrand } from "../../../../../models/product-brand";
import { prepareImages } from "../../../../utils/images";
import { getErrorMessage } from "../../../../utils/error-message";
import { nestedForm } from "../../../../utils/nested-form";
import { useState } from "react";
import { FormImage } from "../../../../../types/shared";
import ThumbnailForm from "../../../../components/forms/thumbnail-form";
import * as FocusModalPrimitives from "@radix-ui/react-dialog";

type AdminProductBrandCreateReq = {
  title: string;
};

type AdminProductBrandCreateRes = {
  brand: ProductBrand;
};

const NewProductBrand = () => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { client } = useMedusa();
  const [open, setOpen] = useState(false);

  const form = useForm({
    defaultValues: createBlank(),
  });

  const { mutate } = useAdminCustomPost<
    AdminProductBrandCreateReq,
    AdminProductBrandCreateRes
  >(`/brands`, ["brands", "create"]);

  const {
    handleSubmit,
    formState: { isDirty },
    reset,
  } = form;

  const onSubmit = (publish = true) =>
    handleSubmit(async (data) => {
      const payload = createPayload(data);
      if (data.thumbnail?.images?.length) {
        let preppedImages: FormImage[] = [];

        try {
          preppedImages = await prepareImages(data.thumbnail.images, client);

          setOpen(false);
        } catch (error) {
          let errorMessage = t(
            "new-something-went-wrong-while-trying-to-upload-images",
            "Something went wrong while trying to upload images."
          );
          const response = (error as any).response as Response;

          if (response.status === 500) {
            errorMessage =
              errorMessage +
              " " +
              t(
                "new-no-file-service-configured",
                "You might not have a file service configured. Please contact your administrator"
              );
          }

          toast({
            title: t("new-error", "Error"),
            description: errorMessage,
          });
          return;
        }
        const urls = preppedImages.map((image) => image.url);

        payload.images = urls;
      }

      if (data.thumbnail?.images?.length) {
        let preppedImages: FormImage[] = [];

        try {
          preppedImages = await prepareImages(data.thumbnail.images, client);
        } catch (error) {
          let errorMessage = t(
            "new-upload-thumbnail-error",
            "Something went wrong while trying to upload the thumbnail."
          );
          const response = (error as any).response as Response;

          if (response.status === 500) {
            errorMessage =
              errorMessage +
              " " +
              t(
                "new-no-file-service-configured",
                "You might not have a file service configured. Please contact your administrator"
              );
          }

          toast({ title: t("new-error", "Error"), description: errorMessage });
          return;
        }
        const urls = preppedImages.map((image) => image.url);

        payload.thumbnail = urls[0];
      }

      mutate(payload, {
        onSuccess: ({ brand }) => {
          navigate(`${brand.id}`);
        },
        onError: (err) => {
          toast({
            title: t("new-error", "Error"),
            description: getErrorMessage(err),
          });
        },
      });
    });

  return (
    <>
      <Toaster />
      <FocusModalPrimitives.Root open={open} onOpenChange={setOpen}>
        <FocusModal.Trigger asChild>
          <Button variant="secondary" size="base" onClick={null}>
            New Brand
          </Button>
        </FocusModal.Trigger>
        <FocusModal.Content>
          <FocusModal.Header>
            <Button onClick={onSubmit(true)}>Save</Button>
          </FocusModal.Header>
          <FocusModal.Body className="flex flex-col items-center py-16 overflow-y-auto">
            <div className="h-full w-full px-[20rem]">
              <Text size="large" weight="plus" className="text-ui-fg-base">
                {t("new-general-information-title", "General information")}
              </Text>
              <GeneralForm form={nestedForm(form, "general")} />
              <Text size="large" weight="plus" className="text-ui-fg-base">
                {t("new-thumbnail-title", "Thumbnail")}
              </Text>
              <ThumbnailForm form={nestedForm(form, "thumbnail")} />
            </div>
          </FocusModal.Body>
        </FocusModal.Content>
      </FocusModalPrimitives.Root>
    </>
  );
};

export default NewProductBrand;

const createBlank = () => {
  return {
    general: {
      title: "",
      handle: null,
    },
    thumbnail: {
      images: [],
    },
  };
};

const createPayload = (data): AdminPostProductBrandsReq => {
  const payload: AdminPostProductBrandsReq = {
    title: data?.general?.title,
    handle:
      data?.general?.handle ||
      data?.general?.title?.toLowerCase()?.replace(" ", "-"),
  };
  return payload;
};
