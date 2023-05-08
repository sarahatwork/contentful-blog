import { IGatsbyImageData } from 'gatsby-plugin-image'
import { z } from 'zod'

interface IProps<T> {
  items: ReadonlyArray<{
    raw: string
    references: ReadonlyArray<{
      __typename: string | null
      contentful_id: string | null
      gatsbyImage: IGatsbyImageData | null
    }>
  } | null> | null
  schema: z.ZodType<T>
}

const FIELD_SCHEMA = z.object({
  name: z.string(),
  data: z.string(),
  type: z.union([
    z.literal('text'),
    z.literal('media'),
    z.literal('richText'),
    z.literal('boolean'),
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
              const parsedFieldValue = JSON.parse(parsedField.data) || undefined

              switch (parsedField.type) {
                case 'richText':
                  console.log('=====', field)
                  console.log('=====', item.references)
                  acc[parsedField.name] = {
                    raw: parsedField.data,
                    references: item.references,
                  }
                  break
                case 'boolean':
                  acc[parsedField.name] = !!parsedFieldValue
                  break
                case 'media':
                  const image =
                    parsedFieldValue?.sys?.id &&
                    item.references.find(
                      (r) => r.contentful_id === parsedFieldValue.sys.id
                    )?.gatsbyImage
                  if (image) acc[parsedField.name] = image
                  break
                default:
                  acc[parsedField.name] = parsedFieldValue
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
