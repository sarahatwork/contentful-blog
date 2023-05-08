import { IGatsbyImageData } from 'gatsby-plugin-image'
import { z } from 'zod'

interface IProps<T> {
  items: ReadonlyArray<{
    raw: string
    references?: ReadonlyArray<{
      __typename: string | null
      contentful_id?: string | null
      gatsbyImage?: IGatsbyImageData | null
    }>
  } | null> | null
  schema: z.ZodType<T>
}

const FIELD_SCHEMA = z.object({
  name: z.string(),
  data: z.any(),
  type: z.union([
    z.literal('text'),
    z.literal('mediaSingle'),
    z.literal('mediaMultiple'),
    z.literal('richText'),
    z.literal('boolean'),
    z.literal('referenceSingle'),
  ]),
})

const useRepeater = <T>({ items, schema }: IProps<T>) => {
  if (!items) return null

  const mappedItems = items.flatMap((item) =>
    item
      ? [
          Object.values(JSON.parse(item.raw)).reduce(
            (acc: Record<string, any>, field) => {
              const parsedField = FIELD_SCHEMA.parse(field)

              switch (parsedField.type) {
                case 'richText':
                  acc[parsedField.name] = {
                    raw: JSON.stringify(parsedField.data),
                    references: item.references?.filter(
                      (ref) => ref.__typename === 'ContentfulAsset'
                    ),
                  }
                  break
                case 'boolean':
                  acc[parsedField.name] = !!parsedField.data
                  break
                case 'mediaSingle':
                  const image =
                    parsedField.data?.sys?.id &&
                    item.references?.find(
                      (r) => r.contentful_id === parsedField.data.sys.id
                    )?.gatsbyImage
                  if (image) acc[parsedField.name] = image
                  break
                case 'mediaMultiple':
                  acc[parsedField.name] = parsedField.data.reduce(
                    (mediaAcc, assetLink) => {
                      const image = item.references?.find(
                        (r) => r.contentful_id === assetLink.sys.id
                      )?.gatsbyImage

                      if (image) {
                        mediaAcc.push(image)
                      }

                      return mediaAcc
                    },
                    []
                  )
                  break
                case 'referenceSingle':
                  const reference =
                    parsedField.data?.sys?.id &&
                    item.references?.find(
                      (r) => r.contentful_id === parsedField.data.sys.id
                    )
                  if (reference) acc[parsedField.name] = reference
                  break
                default:
                  acc[parsedField.name] = parsedField.data ?? undefined
              }
              return acc
            },
            {}
          ),
        ]
      : []
  )

  return schema.parse(mappedItems)
}
export default useRepeater
