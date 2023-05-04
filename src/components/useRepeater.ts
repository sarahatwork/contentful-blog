import { z } from 'zod'

interface IProps<T> {
  items: ReadonlyArray<{
    blockFields: ReadonlyArray<Queries.RepeaterFragment>
  } | null> | null
  schema: z.ZodType<T>
}

const useRepeater = <T>({ items, schema }: IProps<T>) => {
  if (!items) return null

  const object = items.flatMap((e) =>
    e
      ? [
          e.blockFields.reduce((acc, property) => {
            if (!property) return acc

            switch (property.__typename) {
              case 'RepeaterFieldText':
                acc[property.name] = property.text ?? undefined
                break
              case 'RepeaterFieldRichText':
                acc[property.name] = {
                  raw: property.richTextRaw,
                  references: property.richTextReferences,
                }
                break
              case 'RepeaterFieldMedia':
                acc[property.name] = property.media
                break
              case 'RepeaterFieldBoolean':
                acc[property.name] = !!property.boolean
                break
            }
            return acc
          }, {}),
        ]
      : []
  )

  return schema.parse(object)
}
export default useRepeater
